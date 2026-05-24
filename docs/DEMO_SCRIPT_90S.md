# 90-Second Demo Script

## Opening

This is WorkProof Payment Gate for Hedera Agents, a Week 5 Policy Agent prototype for policy-constrained AI-agent payments.

The problem is simple: once AI agents can perform work and request payment, the human reviewer becomes the bottleneck. The agent should not bypass the human. It should package the evidence so the human can decide faster and safer.

## Scenario

Here an AI developer agent wants to pay 1.00 USDC for a completed API/task result.

The payment intent is local dry-run only. There is no wallet, no Hedera client initialization, and no transaction.

## No Proof

First, the agent requests the payment without WorkProof.

The gate stops it at `REQUIRED_EVIDENCE`. It asks for a scope hash, artifact hash, artifact paths, test command, test exit code, test log hash, policy rule ids, and the payment intent payload hash.

## Proof But No Approval

Next, the WorkProof bundle is attached. The test passes, the artifact hash exists, and the intent payload hash matches.

The state moves to `READY_FOR_APPROVAL`. It still cannot execute because human approval is separate from proof.

## Proof And Approval

Finally, the human approval record matches the exact intent payload hash and scope hash.

Now the gate reaches `ALLOW_DRY_RUN`. It emits a WorkProof audit event and decision packet. The only allowed execution path is local dry-run.

## Agent Kit Fit

The prototype uses the actual `@hashgraph/hedera-agent-kit` package.

It creates a real `BaseTool` subclass for the payment intent and real `AbstractPolicy` subclasses for no-network, evidence-required, and approval-required gates.

This maps to Pre-Tool Execution, Post-Parameter Normalization, Post-Core Action, and Post-Tool Execution.

## Close

The core idea is "No proof, no pay."

The result is not just a payment approval button. It is a policy layer that helps humans decide whether an AI-agent payment is justified before any transaction can happen.
