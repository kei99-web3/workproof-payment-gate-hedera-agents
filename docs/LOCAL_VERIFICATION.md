# Local Verification

Verified locally on 2026-05-23 JST.

## Commands

```bash
npm install --package-lock=false --ignore-scripts
npm test
npm run demo
npm run serve:demo
```

## Test Result

`npm test` passes 10 tests:

- hosted demo smoke test;
- blocked unsafe network/payment action path;
- missing WorkProof evidence path;
- proof-complete but approval-missing path;
- approved local dry-run path;
- failed-test proof rejection path;
- real Hedera Agent Kit `BaseTool` bridge path;
- real `AbstractPolicy` no-network block path;
- real `AbstractPolicy` missing-evidence block path;
- real `AbstractPolicy` approval-required block path.

## Demo Result

`npm run demo` exits successfully and prints:

- `missing_proof`: `REQUIRED_EVIDENCE`
- `proof_without_approval`: `READY_FOR_APPROVAL`
- `approved_dry_run`: `ALLOW_DRY_RUN`
- Agent Kit BaseTool dry-run decision packet
- Agent Kit policy bridge classes:
  - `WorkProofNoNetworkPolicy`
  - `WorkProofEvidencePolicy`
  - `WorkProofApprovalPolicy`

See `docs/DEMO_OUTPUT_SUMMARY.md`.

## Audit Result

`npm audit --omit=dev` currently reports 6 vulnerabilities in the transitive Hedera SDK dependency path:

- high-severity `protobufjs` advisories through `@hiero-ledger/proto` / `@hiero-ledger/sdk`, with no npm fix available at the time of local verification;
- moderate `ws` advisories through `ethers`, with an audit-fix path reported by npm.

The local demo does not initialize a Hedera client, does not parse network payloads, does not use a wallet, and does not submit transactions. Re-run audit before any public submission and document the latest result.

## Secret Scan

A keyword scan over the staging package did not find secret values. Expected hits were safety-boundary words such as `secret_read`, `oauth`, and no-secrets documentation.

## Screenshots

Local screenshots are stored in the private workspace under:

`deliverables/screenshots/`

Do not publish or attach screenshots until public repo/demo/submission approval is granted.
