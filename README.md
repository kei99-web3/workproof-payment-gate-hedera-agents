# WorkProof Payment Gate for Hedera Agents

A Hedera Agent Kit policy gate that makes AI-agent USDC payments evidence-gated: no reproducible WorkProof, no matching human approval, no payment release.

This is a local dry-run prototype for Hedera AI Agent Bounty Week 5.

Hosted demo path after GitHub Pages deployment: `/`.

## 30-Second Judge Read

Week 5 asks for policy-constrained agent payments in HBAR or USDC. This project demonstrates the USDC path:

> An AI developer agent wants to pay `1.00 USDC` for completed work. The policy agent refuses to move the payment intent forward until the work has reproducible proof and a matching human approval record.

The differentiator is not a generic allow/deny button. It is **No proof, no pay**: the agent packages the evidence a human needs to make a faster, safer decision before funds can move.

This is not another payment button. It is a reusable policy primitive for agentic commerce on Hedera.

## Why It Matters

AI agents can complete work faster than humans can safely review payment requests. WorkProof Payment Gate solves that bottleneck by turning payment release into an evidence-gated policy decision.

The local demo proves the policy boundary before funds can move: no wallet, no secrets, and no transaction in local mode.

## Bounty Fit

| Week 5 need | This prototype | Prize angle |
| --- | --- | --- |
| Policy-constrained agent payments | A deterministic WorkProof policy gate for a `1.00 USDC` payment intent. | Turns Week 5 payment policy into a reusable approval primitive, not a one-off transfer demo. |
| Hedera Agent Kit as core technology | Real Agent Kit v4 `BaseTool` and `AbstractPolicy` bridge classes. | Shows the policy lifecycle as the core implementation surface. |
| Human-in-the-loop safeguards | A separate approval record must match the exact intent payload hash and scope hash. | Makes human review faster without bypassing human judgment. |
| Demo clarity | Local interactive demo shows missing proof, proof without approval, approved dry-run, and blocked network action. | Gives judges four visible policy outcomes in seconds. |
| Financial safety | Local mode uses `network_action=none`; no wallet, no client initialization, no signature, no transaction. | Demonstrates the safety boundary before funds can move. |

## Demo Scenarios

| Scenario | Result |
| --- | --- |
| Missing proof | `REQUIRED_EVIDENCE`: payment intent cannot move forward. |
| Proof attached | `READY_FOR_APPROVAL`: evidence is complete, but human approval is still required. |
| Proof and approval match | `ALLOW_DRY_RUN`: only local dry-run execution is allowed. |
| Network action requested | `BLOCKED`: transaction path is stopped before execution. |

## What This Proves

An AI developer agent wants to pay `1.00 USDC` for a completed API/task result. The WorkProof Payment Gate does not allow the payment intent to become releasable until:

- the payment intent is fixed to the demo asset and amount: `USDC`, `1.00`, `decimals=6`, `amount_minor_units=1000000`;
- the action has `network_action=none`;
- a WorkProof bundle includes scope hash, artifact hash, artifact paths, test command, test exit code, test log hash, policy rule ids, and intent payload hash;
- a separate human approval record matches the exact intent payload hash and scope hash.

This is not a wallet demo and does not submit any transaction.

## Run Locally

```bash
npm test
npm run demo
npm run serve:demo
```

The test suite uses only Node.js built-ins. No `.env`, wallet, OAuth, private key, testnet, mainnet, HCS topic, or transaction is required.

`npm run serve:demo` starts a local-only static server at `127.0.0.1` for the hosted-demo candidate in `hosted-demo/index.html`. This is not a public hosted URL.

## Hosted Demo Source

The public hosted demo is generated from `hosted-demo/index.html`. It is a static browser demo: no wallet, no credentials, no Hedera client initialization, and no transaction path.

## State Machine

| State | Meaning |
| --- | --- |
| `BLOCKED` | Unsafe action type, network action, forbidden recipient class, or non-demo payment parameters. |
| `REQUIRED_EVIDENCE` | Payment intent is in scope, but WorkProof is missing or invalid. |
| `READY_FOR_APPROVAL` | WorkProof is complete, but no matching human approval record exists. |
| `USER_APPROVED_EXECUTABLE` | Proof and approval match the exact intent payload and scope. |
| `ALLOW_DRY_RUN` | The only executable path in this local prototype. It emits a decision packet and audit event. |

## Hedera Agent Kit Mapping

The prototype is designed around the Hedera Agent Kit v4 hook/policy lifecycle described in the official Hedera docs:

- `@hashgraph/hedera-agent-kit` as the core package;
- `@hashgraph/hedera-agent-kit/policies` for policy base classes and built-in policies;
- `@hashgraph/hedera-agent-kit/hooks` for hook base classes and built-in hooks;
- `@hiero-ledger/sdk` as the peer Hedera SDK package.

Local mapping:

| Local stage | Agent Kit lifecycle target |
| --- | --- |
| Classify payment intent | Pre-Tool Execution policy |
| Validate amount, asset, recipient class, and purpose | Post-Parameter Normalization policy |
| Verify WorkProof before release | Post-Core Action policy before transaction submission |
| Emit decision packet and audit event | Post-Tool Execution hook; future HCS/HOL audit hook after approval |

The `src/agent-kit-adapter.mjs` module exposes `WorkProofPaymentTool` and an `inspectAgentKitAvailability()` helper. The helper only checks local package availability; it does not initialize a Hedera client and does not touch credentials.

The adapter also exposes `createAgentKitWorkProofPaymentToolClass()`, which creates a real Agent Kit `BaseTool` subclass when `@hashgraph/hedera-agent-kit` is installed. Its `coreAction` evaluates the WorkProof policy and its `shouldSecondaryAction()` returns `false`, so no transaction signing/submission path runs in local mode.

`createAgentKitWorkProofPolicyClasses()` creates real Agent Kit `AbstractPolicy` subclasses:

- `WorkProofNoNetworkPolicy` blocks unsafe or network-bound actions at Pre-Tool Execution.
- `WorkProofEvidencePolicy` blocks missing proof at Post-Parameter Normalization.
- `WorkProofApprovalPolicy` blocks proof-complete intents without approval at Post-Core Action.

Verified local package versions on 2026-05-23:

| Package | Version evidence |
| --- | --- |
| `@hashgraph/hedera-agent-kit` | npm latest `4.0.0`; exports `BaseTool`, `AbstractPolicy`, `AbstractHook` |
| `@hiero-ledger/sdk` | npm latest `2.84.0`; satisfies Agent Kit peer `^2.81.0` |
| `@hashgraph/hedera-agent-kit/hooks` | exports `HcsAuditTrailHook`, `HolAuditTrailHook` |
| `@hashgraph/hedera-agent-kit/policies` | exports `MaxRecipientsPolicy`, `RejectToolPolicy` |

## Known Dependency Note

`npm audit --omit=dev` currently reports vulnerabilities in the transitive `@hiero-ledger/sdk` dependency chain, including high-severity `protobufjs` advisories with no npm fix available at the time of local verification. The local demo avoids wallet, client initialization, network payload parsing, and transaction submission. Before any public submission, rerun audit and document the risk or upgraded dependency path.

## Safety Boundaries

The following actions remain outside this local prototype and require explicit user approval:

- public GitHub publication;
- hosted demo deployment;
- GitHub issue feedback posting;
- wallet creation, connection, or payout handling;
- faucet/testnet/mainnet use;
- HCS topic creation or audit message submission;
- OAuth, secrets, `.env`, private key, or KYC document access;
- terms acceptance and final submission.

## Review Materials

- `docs/APPROVAL_GATES.md`: what requires explicit human approval.
- `docs/LOCAL_VERIFICATION.md`: local test, audit, and secret-scan notes.
- `docs/SUBMISSION_CHECKLIST.md`: preflight checklist before public submission.
- `docs/DEMO_SCRIPT_90S.md`: short walkthrough script.
- `docs/FEEDBACK_ISSUE_DRAFT.md`: draft feedback issue text; do not post without approval.
- `docs/DEPENDENCY_AUDIT.md`: dependency audit note.
- `docs/SCREENSHOTS.md`: local screenshot candidates.
- `docs/DEMO_OUTPUT_SUMMARY.md`: concise summary of `npm run demo` output.
