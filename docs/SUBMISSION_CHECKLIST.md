# Submission Checklist

This checklist is for a future public submission. Do not execute approval-gated steps without explicit user approval.

## Local Readiness

- [x] One clear Week 5 scenario: an AI developer agent wants to pay `1.00 USDC`.
- [x] "No proof, no pay" proof bundle is implemented.
- [x] Human approval is separate from proof.
- [x] Local dry-run engine emits a decision packet and audit event.
- [x] Hedera Agent Kit v4 `BaseTool` bridge exists.
- [x] Hedera Agent Kit v4 `AbstractPolicy` bridge exists.
- [x] Tests pass locally.
- [x] Hosted demo candidate exists locally.
- [x] Feedback issue draft exists locally.
- [x] Dependency audit note exists.
- [x] 2026-06-03 local pre-submission audit exists in the private workspace.
- [ ] Recheck official Week 5 requirements after Week 5 opens.

## User Approval Required

- [x] Choose final public repository name: `workproof-payment-gate-hedera-agents`.
- [x] Choose license: MIT.
- [x] Public GitHub repo created: https://github.com/kei99-web3/workproof-payment-gate-hedera-agents
- [x] Hosted demo deployed: https://kei99-web3.github.io/workproof-payment-gate-hedera-agents/
- [ ] Approve any public repo or hosted demo updates after the latest local changes.
- [ ] Approve GitHub feedback issue posting.
- [ ] Provide or enter payout wallet address directly.
- [ ] Review and accept official terms.
- [ ] Approve final submission.

## Public Repo Preflight

- [x] Confirm only staging package files are prepared for publication.
- [x] Confirm `.env`, keys, tokens, wallet material, and private workspace files are absent from the local package scan.
- [x] Re-run `npm test` on 2026-06-03 JST.
- [x] Re-run `npm audit --omit=dev` on 2026-06-03 JST.
- [ ] Verify README first screen explains Week 5, `1.00 USDC`, Agent Kit, and no-wallet local mode.
- [x] Verify hosted demo URL returns HTTP 200 on 2026-06-03 JST.
- [ ] Verify hosted demo works on desktop and mobile after any approved public update.
- [ ] Store public repo URL, hosted demo URL, and feedback issue URL in the submission draft.
