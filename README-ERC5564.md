# Bears — ERC-5564 migration

The frontend now uses the ERC-5564 Announcer configured by `@scopelift/stealth-address-sdk` instead of the legacy `StealthPayment` ledger contract.

## Current flow

1. Person B generates a stealth identity (spending/viewing key pairs).
2. Person B shares only the stealth meta-address.
3. Person A derives a one-time stealth address and ephemeral public key.
4. Person A publishes an ERC-5564 `Announcement` through the canonical Announcer address configured by the SDK.
5. Person A sends ETH directly to the one-time stealth address.
6. Person B scans `Announcement` events from the ERC-5564 start block on Sepolia.
7. The SDK filters announcements using B's spending public key and viewing private key.
8. B derives the stealth private key and spends ETH directly from the stealth address.

## Environment

`VITE_SEPOLIA_RPC_URL` is optional. If omitted, the frontend uses the public Sepolia RPC fallback in `src/App.jsx`.

For a deployed app, set `VITE_SEPOLIA_RPC_URL` in Vercel to a reliable Sepolia RPC provider.

## Important

`stealthcontract.sol` and `src/contract.js` are retained as the legacy implementation/backup. The current frontend does not import or call them.

The browser currently stores the stealth private keys in localStorage for this prototype. This is acceptable only for a controlled demo; production software should use encrypted/key-managed storage.
