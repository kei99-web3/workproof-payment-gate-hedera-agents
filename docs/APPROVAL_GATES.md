# Approval Gates

This prototype is intentionally local-first and no-transaction by default.

The following actions are outside the local demo and require explicit human approval before they happen:

- new public GitHub publication or public repo updates;
- new hosted demo deployment or hosted demo updates;
- GitHub issue feedback posting;
- wallet creation, connection, address handling, or payout handling;
- faucet, testnet, mainnet, HCS topic creation, or any transaction;
- OAuth, secrets, `.env`, private key, seed phrase, API key, or KYC document access;
- terms acceptance;
- final submission.

## Local Mode Contract

The demo payment intent uses:

- `asset`: `USDC`
- `amount`: `1.00`
- `amount_minor_units`: `1000000`
- `network_action`: `none`

No Hedera client is initialized in local mode. No wallet is loaded. No signing path exists. `WorkProofPaymentTool.shouldSecondaryAction()` returns `false` so the Agent Kit tool bridge cannot move into a secondary transaction action during the local demo.

## Why This Matters

The project demonstrates a policy boundary before money moves. The point is not to bypass human judgment. The point is to package evidence so the human can decide faster:

- What is the agent trying to pay for?
- Is the requested work inside the approved scope?
- What artifact and test evidence exists?
- Does a separate approval record match the exact payment payload?
- Is any network or wallet action being requested?
