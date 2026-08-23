# Bears — ERC-5564 migration (Step 1)

This version replaces the custom `StealthPayment` payment/claim path in `src/App.jsx` with the ERC-5564 Announcer flow exposed by `@scopelift/stealth-address-sdk`.

## What changed

- `src/App.jsx` now imports the SDK's canonical `ERC5564_CONTRACT_ADDRESS` and `createStealthClient()`.
- Person A generates a one-time stealth address, publishes an ERC-5564 Announcement, then sends ETH directly to the stealth address.
- Person B scans ERC-5564 Announcement events; no custom Payment ID is required.
- Person B derives the stealth private key and sends ETH from the stealth EOA to the connected wallet.
- The old `stealthcontract.sol` and `src/contract.js` are retained as a backup and are no longer used by the new App.jsx flow.
- The generated identity now persists the spending public key as well as the private keys. Older identities can derive the public key from the spending private key.

## Run

```bash
npm install
npm run build
npm run dev
```

Use Ethereum Sepolia (chain ID `11155111`).

For scanning, the SDK/RPC must be able to query from the ERC-5564 Sepolia deployment's configured start block.

## Important test sequence

1. Person B connects MetaMask and generates a stealth identity.
2. B shares only the stealth meta-address.
3. Person A connects, pastes B's meta-address, and sends a small amount such as `0.001` ETH.
4. A confirms the Announcement transaction and the ETH transfer transaction.
5. Person B clicks **Check & Verify Payment**.
6. B clicks **Claim / Spend Payment**. The derived stealth key signs the transfer from the stealth address.

The first transaction is the ERC-5564 discovery announcement; the second is the actual ETH payment. The custom payment ledger is not involved.
