import { evaluatePaymentGate } from "./policy-engine.mjs";

export const AGENT_KIT_SURFACE = Object.freeze({
  corePackage: "@hashgraph/hedera-agent-kit",
  policySubpath: "@hashgraph/hedera-agent-kit/policies",
  hookSubpath: "@hashgraph/hedera-agent-kit/hooks",
  peerSdk: "@hiero-ledger/sdk",
  lifecycle: [
    "pre_tool_execution",
    "post_parameter_normalization",
    "post_core_action",
    "post_tool_execution"
  ]
});

export class WorkProofPaymentTool {
  constructor({ policyEngine = evaluatePaymentGate } = {}) {
    this.name = "workproof_payment_intent";
    this.description = "Evaluate a 1.00 USDC payment intent against WorkProof evidence before any Hedera transaction.";
    this.policyEngine = policyEngine;
  }

  async execute(input) {
    const decision = this.policyEngine(input);
    return {
      ok: decision.executable,
      dry_run: true,
      decision
    };
  }
}

export async function createAgentKitWorkProofPaymentToolClass() {
  const [{ BaseTool }, { z }] = await Promise.all([
    import(AGENT_KIT_SURFACE.corePackage),
    import("zod")
  ]);

  return class AgentKitWorkProofPaymentTool extends BaseTool {
    method = "workproof_payment_intent";
    name = "WorkProof Payment Intent";
    description = "Dry-run 1.00 USDC payment-intent gate requiring WorkProof evidence and matching human approval.";
    parameters = z.object({
      intent: z.record(z.any()),
      scope: z.record(z.any()),
      proofBundle: z.record(z.any()).nullable().optional(),
      approvalRecord: z.record(z.any()).nullable().optional()
    });

    async normalizeParams(params) {
      return params;
    }

    async coreAction(normalisedParams) {
      return {
        dry_run: true,
        decision: evaluatePaymentGate(normalisedParams)
      };
    }

    async shouldSecondaryAction() {
      return false;
    }

    async secondaryAction(request) {
      return request;
    }

    async handleError(error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        raw: { error: message },
        humanMessage: `WorkProof Payment Intent stopped: ${message}`
      };
    }
  };
}

export async function createAgentKitWorkProofPolicyClasses() {
  const { AbstractPolicy } = await import(AGENT_KIT_SURFACE.corePackage);

  class WorkProofNoNetworkPolicy extends AbstractPolicy {
    name = "WorkProof No Network Policy";
    description = "Blocks Hedera network actions in the local WorkProof demo.";
    relevantTools = ["workproof_payment_intent"];

    async shouldBlockPreToolExecution(params) {
      const decision = evaluatePaymentGate({
        intent: params.rawParams.intent,
        scope: params.rawParams.scope,
        proofBundle: params.rawParams.proofBundle ?? null,
        approvalRecord: params.rawParams.approvalRecord ?? null
      });

      return decision.state === "BLOCKED";
    }
  }

  class WorkProofEvidencePolicy extends AbstractPolicy {
    name = "WorkProof Evidence Policy";
    description = "Blocks payment intents that do not include reproducible WorkProof evidence.";
    relevantTools = ["workproof_payment_intent"];

    async shouldBlockPostParamsNormalization(params) {
      const decision = evaluatePaymentGate({
        intent: params.normalisedParams.intent,
        scope: params.normalisedParams.scope,
        proofBundle: params.normalisedParams.proofBundle ?? null,
        approvalRecord: params.normalisedParams.approvalRecord ?? null
      });

      return decision.state === "REQUIRED_EVIDENCE";
    }
  }

  class WorkProofApprovalPolicy extends AbstractPolicy {
    name = "WorkProof Approval Policy";
    description = "Blocks releasable-looking payment intents until scoped human approval matches.";
    relevantTools = ["workproof_payment_intent"];

    async shouldBlockPostCoreAction(params) {
      return params.coreActionResult?.decision?.state === "READY_FOR_APPROVAL";
    }
  }

  return {
    WorkProofNoNetworkPolicy,
    WorkProofEvidencePolicy,
    WorkProofApprovalPolicy
  };
}

export async function inspectAgentKitAvailability() {
  const results = {};

  for (const [key, packageName] of Object.entries({
    core: AGENT_KIT_SURFACE.corePackage,
    policies: AGENT_KIT_SURFACE.policySubpath,
    hooks: AGENT_KIT_SURFACE.hookSubpath
  })) {
    try {
      const module = await import(packageName);
      results[key] = {
        available: true,
        exports: Object.keys(module).sort()
      };
    } catch (error) {
      results[key] = {
        available: false,
        reason: error.code === "ERR_MODULE_NOT_FOUND" ? "package_not_installed" : error.message
      };
    }
  }

  return {
    surface: AGENT_KIT_SURFACE,
    imports: results,
    base_tool_bridge: results.core.available && results.core.exports.includes("BaseTool"),
    policy_bridge: results.core.available && results.core.exports.includes("AbstractPolicy"),
    wallet_required: false,
    network_action: "none"
  };
}

export function agentKitMappingForReadme() {
  return [
    {
      local_stage: "classify payment intent",
      agent_kit_stage: "Pre-Tool Execution policy",
      local_module: "src/policy-engine.mjs"
    },
    {
      local_stage: "validate amount, asset, recipient class, and purpose",
      agent_kit_stage: "Post-Parameter Normalization policy",
      local_module: "src/policy-engine.mjs"
    },
    {
      local_stage: "verify WorkProof before release",
      agent_kit_stage: "Post-Parameter Normalization policy and Post-Core Action policy before transaction submission",
      local_module: "src/policy-engine.mjs"
    },
    {
      local_stage: "emit decision packet and audit event",
      agent_kit_stage: "Post-Tool Execution hook, future HCS/HOL audit hook",
      local_module: "src/policy-engine.mjs"
    }
  ];
}
