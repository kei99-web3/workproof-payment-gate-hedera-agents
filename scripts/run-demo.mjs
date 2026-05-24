import {
  WorkProofPaymentTool,
  agentKitMappingForReadme,
  createAgentKitWorkProofPolicyClasses,
  createAgentKitWorkProofPaymentToolClass,
  inspectAgentKitAvailability
} from "../src/agent-kit-adapter.mjs";
import {
  createApprovalRecord,
  createDemoPaymentIntent,
  createDemoScope,
  createProofBundle
} from "../src/workproof.mjs";

const scope = createDemoScope();
const intent = createDemoPaymentIntent();
const tool = new WorkProofPaymentTool();

const missingProof = await tool.execute({ intent, scope });

const proofBundle = createProofBundle({
  scope,
  intent,
  artifact: {
    paths: ["artifacts/api_result.json", "tests/api_result.test.log"],
    contents: {
      "artifacts/api_result.json": { ok: true, result_id: "demo-result-001" }
    }
  },
  testLog: {
    command: "node --test test/*.test.mjs",
    exit_code: 0,
    output: "ok 4 WorkProof policy paths"
  }
});

const proofWithoutApproval = await tool.execute({ intent, scope, proofBundle });
const approvalRecord = createApprovalRecord({ intent, scope });
const approvedDryRun = await tool.execute({ intent, scope, proofBundle, approvalRecord });
const agentKitAvailability = await inspectAgentKitAvailability();

let agentKitDryRun = null;
let policyBridge = null;
if (agentKitAvailability.base_tool_bridge) {
  const AgentKitWorkProofPaymentTool = await createAgentKitWorkProofPaymentToolClass();
  const agentKitTool = new AgentKitWorkProofPaymentTool();
  agentKitDryRun = await agentKitTool.execute(null, { hooks: [] }, { intent, scope, proofBundle, approvalRecord });
}

if (agentKitAvailability.policy_bridge) {
  const policies = await createAgentKitWorkProofPolicyClasses();
  policyBridge = Object.keys(policies);
}

console.log(JSON.stringify({
  scenario: "AI developer agent wants to pay 1.00 USDC for a completed API/task result.",
  states: {
    missing_proof: missingProof.decision.state,
    proof_without_approval: proofWithoutApproval.decision.state,
    approved_dry_run: approvedDryRun.decision.state
  },
  approved_decision_packet: approvedDryRun.decision,
  agent_kit_base_tool_dry_run: agentKitDryRun,
  agent_kit_policy_bridge: policyBridge,
  agent_kit_mapping: agentKitMappingForReadme(),
  agent_kit_availability: agentKitAvailability,
  safety: {
    wallet_used: false,
    credentials_read: false,
    transaction_submitted: false,
    network_action: "none"
  }
}, null, 2));
