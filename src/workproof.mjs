import { sha256, stableStringify } from "./hash.mjs";

export const FIXED_DEMO_PAYMENT = Object.freeze({
  asset: "USDC",
  decimals: 6,
  amount: "1.00",
  amount_minor_units: 1_000_000,
  network_action: "none"
});

export const REQUIRED_PROOF_FIELDS = Object.freeze([
  "task_id",
  "scope_hash",
  "artifact_hash",
  "artifact_paths",
  "test_command",
  "test_exit_code",
  "test_log_hash",
  "policy_rule_ids",
  "intent_payload_hash"
]);

export function normalizeScope(scope) {
  if (!scope || typeof scope !== "object") {
    throw new TypeError("scope must be an object");
  }

  return {
    task_id: String(scope.task_id),
    title: String(scope.title),
    allowed_artifact_paths: [...(scope.allowed_artifact_paths ?? [])].sort(),
    acceptance_criteria: [...(scope.acceptance_criteria ?? [])].sort()
  };
}

export function scopeHash(scope) {
  return sha256(normalizeScope(scope));
}

export function normalizePaymentIntent(intent) {
  return {
    task_id: String(intent.task_id),
    action_type: String(intent.action_type ?? "usdc_payment_intent"),
    purpose: String(intent.purpose),
    asset: String(intent.asset),
    decimals: Number(intent.decimals),
    amount: String(intent.amount),
    amount_minor_units: Number(intent.amount_minor_units),
    recipient: {
      id: String(intent.recipient?.id ?? ""),
      class: String(intent.recipient?.class ?? "unknown"),
      display_name: String(intent.recipient?.display_name ?? "")
    },
    network_action: String(intent.network_action ?? "none")
  };
}

export function intentPayloadHash(intent) {
  return sha256(normalizePaymentIntent(intent));
}

export function createDemoScope() {
  return normalizeScope({
    task_id: "TASK-API-RESULT-001",
    title: "Completed API/task result for WorkProof demo",
    allowed_artifact_paths: ["artifacts/api_result.json", "tests/api_result.test.log"],
    acceptance_criteria: [
      "artifact hash is present",
      "test command exits with code 0",
      "payment intent payload matches approval scope"
    ]
  });
}

export function createDemoPaymentIntent(overrides = {}) {
  return normalizePaymentIntent({
    task_id: "TASK-API-RESULT-001",
    action_type: "usdc_payment_intent",
    purpose: "Pay for a completed API/task result after WorkProof verification",
    recipient: {
      id: "demo-api-provider",
      class: "approved_service_vendor",
      display_name: "Demo API Provider"
    },
    ...FIXED_DEMO_PAYMENT,
    ...overrides
  });
}

export function createProofBundle({ scope, intent, artifact, testLog, overrides = {} }) {
  const normalizedScope = normalizeScope(scope);
  const normalizedIntent = normalizePaymentIntent(intent);
  const artifactPaths = [...(artifact.paths ?? [])].sort();

  return {
    task_id: normalizedIntent.task_id,
    scope_hash: scopeHash(normalizedScope),
    artifact_hash: sha256({
      paths: artifactPaths,
      contents: artifact.contents ?? {}
    }),
    artifact_paths: artifactPaths,
    test_command: String(testLog.command),
    test_exit_code: Number(testLog.exit_code),
    test_log_hash: sha256(testLog.output ?? ""),
    policy_rule_ids: ["WP_USDC_AMOUNT_FIXED", "WP_SCOPE_MATCH", "WP_TEST_PASS"],
    intent_payload_hash: intentPayloadHash(normalizedIntent),
    ...overrides
  };
}

export function createApprovalRecord({ intent, scope, approver = "human-reviewer", expiresAt, revoked = false }) {
  const normalizedIntent = normalizePaymentIntent(intent);
  const normalizedScope = normalizeScope(scope);
  const approvedPayloadHash = intentPayloadHash(normalizedIntent);
  const approvedScopeHash = scopeHash(normalizedScope);

  return {
    approval_record_id: `approval_${sha256({ approvedPayloadHash, approvedScopeHash, approver }).slice(0, 16)}`,
    approver,
    approved_payload_hash: approvedPayloadHash,
    scope_hash: approvedScopeHash,
    approved_action_id: normalizedIntent.task_id,
    scope_limit: normalizedScope.title,
    expires_at: expiresAt ?? "2099-01-01T00:00:00.000Z",
    revoked
  };
}

export function proofSummary(proofBundle) {
  if (!proofBundle) {
    return "No WorkProof bundle attached.";
  }

  return stableStringify({
    task_id: proofBundle.task_id,
    scope_hash: proofBundle.scope_hash,
    artifact_hash: proofBundle.artifact_hash,
    test_exit_code: proofBundle.test_exit_code,
    intent_payload_hash: proofBundle.intent_payload_hash
  });
}
