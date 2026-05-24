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

## User Approval Required

- [ ] Choose final public repository name.
- [x] Choose license: MIT.
- [ ] Approve public GitHub repo creation/publication.
- [ ] Approve hosted demo deployment.
- [ ] Approve GitHub feedback issue posting.
- [ ] Provide or enter payout wallet address directly.
- [ ] Review and accept official terms.
- [ ] Approve final submission.

## Public Repo Preflight

- [ ] Confirm only staging package files are published.
- [ ] Confirm `.env`, keys, tokens, wallet material, and private workspace files are absent.
- [ ] Re-run `npm test`.
- [ ] Re-run `npm audit --omit=dev`.
- [ ] Verify README first screen explains Week 5, `1.00 USDC`, Agent Kit, and no-wallet local mode.
- [ ] Verify hosted demo works on desktop and mobile.
- [ ] Store public repo URL, hosted demo URL, and feedback issue URL in the submission draft.
