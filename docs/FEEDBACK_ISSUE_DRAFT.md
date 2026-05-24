# Draft GitHub Feedback Issue

Do not post this issue without explicit user approval.

## Proposed Title

Agent Kit policy lifecycle feedback from a WorkProof payment-gate prototype

## Proposed Body

I built a local dry-run prototype for a policy-constrained payment agent using `@hashgraph/hedera-agent-kit@4.0.0`.

The prototype models a 1.00 USDC payment intent from an AI developer agent and blocks it unless WorkProof evidence and a separate human approval record are present. It does not initialize a Hedera client, use a wallet, create an HCS topic, or submit a transaction.

What worked well:

- `BaseTool` gives a clear lifecycle for `normalizeParams`, `coreAction`, `postCoreActionHook`, optional secondary action, and post-tool hooks.
- `AbstractPolicy` maps well to safety gates. I used three local policies:
  - `WorkProofNoNetworkPolicy` at Pre-Tool Execution to block network-bound actions in local mode.
  - `WorkProofEvidencePolicy` at Post-Parameter Normalization to block missing proof.
  - `WorkProofApprovalPolicy` at Post-Core Action to block proof-complete intents without scoped approval.
- The hooks/policies model is a strong fit for human-in-the-loop payment authorization.

Feedback / questions:

- It would help to have an official minimal example for a custom dry-run `BaseTool` that intentionally sets `shouldSecondaryAction()` to `false` for policy evaluation without transaction submission.
- It would help to document the recommended pattern for returning structured policy decisions when a policy blocks. Today the policy throws and `BaseTool.handleError()` turns it into an error-like result, which works, but a structured decision packet example would be useful.
- A small official example of a policy-constrained payment intent that stops before wallet/client initialization would make safety-first bounty entries easier to review.
- `npm audit --omit=dev` currently reports transitive advisories under the `@hiero-ledger/sdk` dependency path, including `protobufjs` advisories with no fix reported by npm at the time of local testing. It would be useful to know the recommended contest/demo guidance for documenting this risk when the vulnerable code path is not exercised.

Local evidence:

- `npm test`: 10 passing tests.
- Verified imports: `BaseTool`, `AbstractPolicy`, `AbstractHook`, `HcsAuditTrailHook`, `HolAuditTrailHook`.
- Safety status: no wallet, no secrets, no OAuth, no HCS topic, no transaction, no hosted deployment.

Thanks for the Agent Kit v4 policy/hook system. The lifecycle was straightforward to map to a "no proof, no pay" payment-gate model.
