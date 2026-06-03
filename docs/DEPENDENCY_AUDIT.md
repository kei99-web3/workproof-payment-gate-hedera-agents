# Dependency Audit Note

Checked: 2026-06-03 JST

## Commands

```bash
$env:NODE_OPTIONS='--use-system-ca'
npm view @hashgraph/hedera-agent-kit version dist-tags peerDependencies --json
npm view @hiero-ledger/sdk version --json
npm install --package-lock=false --ignore-scripts
npm install --package-lock-only --ignore-scripts
npm audit --omit=dev
npm audit fix
```

## Findings

| Package path | Severity | Finding | Current mitigation |
| --- | --- | --- | --- |
| `@hashgraph/hedera-agent-kit -> @hiero-ledger/sdk -> @hiero-ledger/proto -> protobufjs` | high | Multiple `protobufjs` advisories; npm reports no fix available. | Local demo imports Agent Kit and uses `BaseTool`, but does not initialize a Hedera client, parse network payloads, create topics, or submit transactions. |
| `ethers -> ws` | moderate | `ws` advisory remains after `npm audit fix`. | The demo remains static/dry-run and does not open a wallet, initialize a Hedera client, or submit transactions. Recheck before final submission/public update. |

## Submission Gate

Before any public update, wallet/testnet/mainnet work, or final submission, rerun dependency audit and either:

- upgrade the affected dependency path if a fixed Agent Kit/Hiero SDK version exists;
- document why the vulnerable code path is unreachable in the demo;
- or stop and request user approval for the residual risk.
