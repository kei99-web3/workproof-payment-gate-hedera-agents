import { sha256 } from "./hash.mjs";
import {
  FIXED_DEMO_PAYMENT,
  REQUIRED_PROOF_FIELDS,
  intentPayloadHash,
  normalizePaymentIntent,
  proofSummary,
  scopeHash
} from "./workproof.mjs";

const BLOCKED_ACTION_TYPES = new Set([
  "secret_read",
  "env_read",
  "private_key",
  "seed_phrase",
  "oauth",
  "kyc_identity_document",
  "wallet",
  "faucet",
  "hcs_topic",
  "hbar_transfer",
  "usdc_transfer",
  "token_association",
  "testnet_transaction",
  "mainnet_transaction"
]);

const ALLOWED_RECIPIENT_CLASSES = new Set([
  "approved_service_vendor",
  "demo_vendor",
  "internal_test_recipient"
]);

export function evaluatePaymentGate({ intent, scope, proofBundle = null, approvalRecord = null, now = new Date() }) {
  const normalizedIntent = normalizePaymentIntent(intent);
  const normalizedScopeHash = scopeHash(scope);
  const payloadHash = intentPayloadHash(normalizedIntent);
  const context = {
    intent: normalizedIntent,
    scope_hash: normalizedScopeHash,
    intent_payload_hash: payloadHash
  };

  const blockReasons = findBlockReasons(normalizedIntent);
  if (blockReasons.length > 0) {
    return buildDecision({
      statePath: ["BLOCKED"],
      ruleIds: ["WP_BLOCK_UNSAFE_ACTION"],
      riskTier: "critical",
      rationale: blockReasons,
      context,
      proofBundle,
      approvalRecord,
      executionStatus: "stopped_before_tool_execution"
    });
  }

  const parameterProblems = validateFixedDemoPayment(normalizedIntent);
  if (parameterProblems.length > 0) {
    return buildDecision({
      statePath: ["BLOCKED"],
      ruleIds: ["WP_BLOCK_NON_DEMO_PAYMENT"],
      riskTier: "high",
      rationale: parameterProblems,
      context,
      proofBundle,
      approvalRecord,
      executionStatus: "stopped_at_parameter_policy"
    });
  }

  const proofProblems = validateProofBundle({
    proofBundle,
    scopeHash: normalizedScopeHash,
    payloadHash,
    taskId: normalizedIntent.task_id
  });

  if (proofProblems.length > 0) {
    return buildDecision({
      statePath: ["REQUIRED_EVIDENCE"],
      ruleIds: ["WP_REQUIRE_WORKPROOF"],
      riskTier: "medium",
      rationale: proofProblems,
      context,
      proofBundle,
      approvalRecord,
      executionStatus: "payment_intent_not_releasable"
    });
  }

  const approvalProblems = validateApprovalRecord({
    approvalRecord,
    scopeHash: normalizedScopeHash,
    payloadHash,
    taskId: normalizedIntent.task_id,
    now
  });

  if (approvalProblems.length > 0) {
    return buildDecision({
      statePath: ["READY_FOR_APPROVAL"],
      ruleIds: ["WP_REQUIRE_HUMAN_APPROVAL"],
      riskTier: "medium",
      rationale: approvalProblems,
      context,
      proofBundle,
      approvalRecord,
      executionStatus: "waiting_for_human_decision"
    });
  }

  return buildDecision({
    statePath: ["READY_FOR_APPROVAL", "USER_APPROVED_EXECUTABLE", "ALLOW_DRY_RUN"],
    ruleIds: ["WP_REQUIRE_WORKPROOF", "WP_REQUIRE_HUMAN_APPROVAL", "WP_ALLOW_LOCAL_DRY_RUN"],
    riskTier: "low",
    rationale: [
      "WorkProof bundle matches the payment intent and task scope.",
      "Approval record matches the intent payload hash and scope hash.",
      "Network action is none, so the only allowed execution is local dry-run."
    ],
    context,
    proofBundle,
    approvalRecord,
    executionStatus: "dry_run_allowed_no_network_action"
  });
}

function findBlockReasons(intent) {
  const reasons = [];

  if (BLOCKED_ACTION_TYPES.has(intent.action_type)) {
    reasons.push(`Action type ${intent.action_type} is outside local autonomous execution.`);
  }

  if (intent.network_action !== "none") {
    reasons.push(`Network action ${intent.network_action} requires explicit user approval.`);
  }

  if (!ALLOWED_RECIPIENT_CLASSES.has(intent.recipient.class)) {
    reasons.push(`Recipient class ${intent.recipient.class} is not approved for the local demo.`);
  }

  return reasons;
}

function validateFixedDemoPayment(intent) {
  const problems = [];

  if (intent.asset !== FIXED_DEMO_PAYMENT.asset) {
    problems.push("The first demo only supports USDC-denominated payment intents.");
  }

  if (intent.decimals !== FIXED_DEMO_PAYMENT.decimals) {
    problems.push("USDC payment intent must use 6 decimals.");
  }

  if (intent.amount !== FIXED_DEMO_PAYMENT.amount) {
    problems.push("The judge-facing demo is fixed to 1.00 USDC.");
  }

  if (intent.amount_minor_units !== FIXED_DEMO_PAYMENT.amount_minor_units) {
    problems.push("1.00 USDC must be represented as 1000000 minor units.");
  }

  return problems;
}

function validateProofBundle({ proofBundle, scopeHash, payloadHash, taskId }) {
  const problems = [];

  if (!proofBundle) {
    return [
      "Missing WorkProof bundle.",
      "Attach scope hash, artifact hash, artifact paths, test result, policy rule ids, and intent payload hash before payment can be considered."
    ];
  }

  for (const field of REQUIRED_PROOF_FIELDS) {
    if (!(field in proofBundle)) {
      problems.push(`Missing proof field: ${field}.`);
    }
  }

  if (proofBundle.task_id !== taskId) {
    problems.push("Proof task_id does not match payment intent task_id.");
  }

  if (proofBundle.scope_hash !== scopeHash) {
    problems.push("Proof scope_hash does not match normalized task scope.");
  }

  if (proofBundle.intent_payload_hash !== payloadHash) {
    problems.push("Proof intent_payload_hash does not match normalized payment intent.");
  }

  if (!Array.isArray(proofBundle.artifact_paths) || proofBundle.artifact_paths.length === 0) {
    problems.push("Proof must include at least one artifact path.");
  }

  if (proofBundle.test_exit_code !== 0) {
    problems.push("Proof test_exit_code must be 0.");
  }

  if (!Array.isArray(proofBundle.policy_rule_ids) || proofBundle.policy_rule_ids.length === 0) {
    problems.push("Proof must include policy_rule_ids.");
  }

  return problems;
}

function validateApprovalRecord({ approvalRecord, scopeHash, payloadHash, taskId, now }) {
  const problems = [];

  if (!approvalRecord) {
    return ["No approval record attached. Human approval is separate from WorkProof evidence."];
  }

  if (approvalRecord.revoked) {
    problems.push("Approval record is revoked.");
  }

  if (approvalRecord.approved_payload_hash !== payloadHash) {
    problems.push("Approval payload hash does not match payment intent.");
  }

  if (approvalRecord.scope_hash !== scopeHash) {
    problems.push("Approval scope hash does not match task scope.");
  }

  if (approvalRecord.approved_action_id !== taskId) {
    problems.push("Approval action id does not match payment intent task id.");
  }

  if (!approvalRecord.expires_at || Number.isNaN(Date.parse(approvalRecord.expires_at))) {
    problems.push("Approval expiry is missing or invalid.");
  } else if (Date.parse(approvalRecord.expires_at) <= now.getTime()) {
    problems.push("Approval record is expired.");
  }

  return problems;
}

function buildDecision({ statePath, ruleIds, riskTier, rationale, context, proofBundle, approvalRecord, executionStatus }) {
  const state = statePath[statePath.length - 1];
  const decisionPacket = {
    state,
    state_path: statePath,
    rule_ids: ruleIds,
    risk_tier: riskTier,
    rationale,
    payment_intent: context.intent,
    scope_hash: context.scope_hash,
    intent_payload_hash: context.intent_payload_hash,
    proof_summary: proofSummary(proofBundle),
    approval_record_id: approvalRecord?.approval_record_id ?? null,
    human_decision_needed: state === "READY_FOR_APPROVAL",
    executable: state === "ALLOW_DRY_RUN",
    network_action: "none"
  };

  const auditEvent = {
    schema_version: "workproof.audit.v0",
    event_id: `audit_${sha256({ decisionPacket, executionStatus }).slice(0, 16)}`,
    timestamp: new Date().toISOString(),
    agent: "WorkProof Payment Gate for Hedera Agents",
    action_id: context.intent.task_id,
    action_type: context.intent.action_type,
    policy_id: "ai-workspace-hedera-week5-local-v0",
    matched_rule_id: ruleIds[ruleIds.length - 1],
    decision: state,
    risk_tier: riskTier,
    rationale,
    evidence: {
      scope_hash: context.scope_hash,
      intent_payload_hash: context.intent_payload_hash,
      proof_attached: Boolean(proofBundle)
    },
    approval_record_id: approvalRecord?.approval_record_id ?? null,
    execution_status: executionStatus
  };

  return {
    ...decisionPacket,
    audit_event: auditEvent
  };
}
