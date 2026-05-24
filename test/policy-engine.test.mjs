import test from "node:test";
import assert from "node:assert/strict";

import { evaluatePaymentGate } from "../src/policy-engine.mjs";
import {
  createAgentKitWorkProofPaymentToolClass,
  createAgentKitWorkProofPolicyClasses,
  inspectAgentKitAvailability
} from "../src/agent-kit-adapter.mjs";
import {
  createApprovalRecord,
  createDemoPaymentIntent,
  createDemoScope,
  createProofBundle
} from "../src/workproof.mjs";

function demoProof({ scope, intent, overrides = {} } = {}) {
  return createProofBundle({
    scope: scope ?? createDemoScope(),
    intent: intent ?? createDemoPaymentIntent(),
    artifact: {
      paths: ["artifacts/api_result.json"],
      contents: {
        "artifacts/api_result.json": { ok: true }
      }
    },
    testLog: {
      command: "node --test test/*.test.mjs",
      exit_code: 0,
      output: "all tests passed"
    },
    overrides
  });
}

test("blocks unsafe network/payment action types before proof review", () => {
  const scope = createDemoScope();
  const intent = createDemoPaymentIntent({
    action_type: "usdc_transfer",
    network_action: "testnet_transaction"
  });

  const decision = evaluatePaymentGate({ intent, scope });

  assert.equal(decision.state, "BLOCKED");
  assert.equal(decision.executable, false);
  assert.match(decision.rationale.join(" "), /requires explicit user approval/);
});

test("requires WorkProof evidence before payment intent can be reviewed for approval", () => {
  const scope = createDemoScope();
  const intent = createDemoPaymentIntent();

  const decision = evaluatePaymentGate({ intent, scope });

  assert.equal(decision.state, "REQUIRED_EVIDENCE");
  assert.equal(decision.executable, false);
  assert.equal(decision.audit_event.execution_status, "payment_intent_not_releasable");
});

test("moves complete WorkProof to approval queue when human approval is absent", () => {
  const scope = createDemoScope();
  const intent = createDemoPaymentIntent();
  const proofBundle = demoProof({ scope, intent });

  const decision = evaluatePaymentGate({ intent, scope, proofBundle });

  assert.equal(decision.state, "READY_FOR_APPROVAL");
  assert.equal(decision.human_decision_needed, true);
  assert.equal(decision.executable, false);
});

test("allows only local dry-run after proof and matching approval are present", () => {
  const scope = createDemoScope();
  const intent = createDemoPaymentIntent();
  const proofBundle = demoProof({ scope, intent });
  const approvalRecord = createApprovalRecord({ intent, scope });

  const decision = evaluatePaymentGate({ intent, scope, proofBundle, approvalRecord });

  assert.equal(decision.state, "ALLOW_DRY_RUN");
  assert.deepEqual(decision.state_path, ["READY_FOR_APPROVAL", "USER_APPROVED_EXECUTABLE", "ALLOW_DRY_RUN"]);
  assert.equal(decision.executable, true);
  assert.equal(decision.audit_event.execution_status, "dry_run_allowed_no_network_action");
  assert.equal(decision.network_action, "none");
});

test("rejects proof with failed tests", () => {
  const scope = createDemoScope();
  const intent = createDemoPaymentIntent();
  const proofBundle = demoProof({ scope, intent, overrides: { test_exit_code: 1 } });

  const decision = evaluatePaymentGate({ intent, scope, proofBundle });

  assert.equal(decision.state, "REQUIRED_EVIDENCE");
  assert.match(decision.rationale.join(" "), /test_exit_code must be 0/);
});

test("bridges to actual Hedera Agent Kit BaseTool without secondary transaction action", async () => {
  const availability = await inspectAgentKitAvailability();

  assert.equal(availability.base_tool_bridge, true);

  const scope = createDemoScope();
  const intent = createDemoPaymentIntent();
  const proofBundle = demoProof({ scope, intent });
  const approvalRecord = createApprovalRecord({ intent, scope });
  const AgentKitWorkProofPaymentTool = await createAgentKitWorkProofPaymentToolClass();
  const tool = new AgentKitWorkProofPaymentTool();

  const result = await tool.execute(null, { hooks: [] }, { intent, scope, proofBundle, approvalRecord });

  assert.equal(result.dry_run, true);
  assert.equal(result.decision.state, "ALLOW_DRY_RUN");
  assert.equal(result.decision.network_action, "none");
});

test("uses actual AbstractPolicy subclasses to block unsafe network actions", async () => {
  const scope = createDemoScope();
  const intent = createDemoPaymentIntent({
    action_type: "usdc_transfer",
    network_action: "testnet_transaction"
  });
  const AgentKitWorkProofPaymentTool = await createAgentKitWorkProofPaymentToolClass();
  const { WorkProofNoNetworkPolicy } = await createAgentKitWorkProofPolicyClasses();
  const tool = new AgentKitWorkProofPaymentTool();

  const result = await tool.execute(
    null,
    { hooks: [new WorkProofNoNetworkPolicy()] },
    { intent, scope }
  );

  assert.match(result.humanMessage, /blocked by policy/);
  assert.match(result.raw.error, /WorkProof No Network Policy/);
});

test("uses actual AbstractPolicy subclasses to block missing evidence", async () => {
  const scope = createDemoScope();
  const intent = createDemoPaymentIntent();
  const AgentKitWorkProofPaymentTool = await createAgentKitWorkProofPaymentToolClass();
  const { WorkProofEvidencePolicy } = await createAgentKitWorkProofPolicyClasses();
  const tool = new AgentKitWorkProofPaymentTool();

  const result = await tool.execute(
    null,
    { hooks: [new WorkProofEvidencePolicy()] },
    { intent, scope }
  );

  assert.match(result.humanMessage, /blocked by policy/);
  assert.match(result.raw.error, /WorkProof Evidence Policy/);
});

test("uses actual AbstractPolicy subclasses to block complete proof without approval", async () => {
  const scope = createDemoScope();
  const intent = createDemoPaymentIntent();
  const proofBundle = demoProof({ scope, intent });
  const AgentKitWorkProofPaymentTool = await createAgentKitWorkProofPaymentToolClass();
  const { WorkProofApprovalPolicy } = await createAgentKitWorkProofPolicyClasses();
  const tool = new AgentKitWorkProofPaymentTool();

  const result = await tool.execute(
    null,
    { hooks: [new WorkProofApprovalPolicy()] },
    { intent, scope, proofBundle }
  );

  assert.match(result.humanMessage, /blocked by policy/);
  assert.match(result.raw.error, /WorkProof Approval Policy/);
});
