# Demo Output Summary

`npm run demo` prints a JSON decision packet for the fixed Week 5 scenario:

> An AI developer agent wants to pay 1.00 USDC for a completed API/task result.

## Expected State Transitions

```json
{
  "missing_proof": "REQUIRED_EVIDENCE",
  "proof_without_approval": "READY_FOR_APPROVAL",
  "approved_dry_run": "ALLOW_DRY_RUN"
}
```

## Approved Dry-Run Decision

The approved path emits:

- `state`: `ALLOW_DRY_RUN`
- `rule_ids`: `WP_REQUIRE_WORKPROOF`, `WP_REQUIRE_HUMAN_APPROVAL`, `WP_ALLOW_LOCAL_DRY_RUN`
- `risk_tier`: `low`
- `asset`: `USDC`
- `amount`: `1.00`
- `amount_minor_units`: `1000000`
- `network_action`: `none`
- `wallet_used`: `false`
- `credentials_read`: `false`
- `transaction_submitted`: `false`

## Agent Kit Evidence

The demo also prints:

- a dry-run result from the real Agent Kit `BaseTool` bridge;
- policy bridge class names:
  - `WorkProofNoNetworkPolicy`
  - `WorkProofEvidencePolicy`
  - `WorkProofApprovalPolicy`
- Agent Kit import availability for core, policies, and hooks;
- lifecycle mapping for pre-tool execution, post-parameter normalization, post-core action, and post-tool execution.

## Safety Interpretation

The output is intentionally not a transaction receipt. It is a local decision packet proving that the policy gate stops missing-proof and missing-approval paths before a payment intent can become executable. The only executable state is local dry-run.
