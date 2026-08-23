🐻 BEARS — Private Wallets \& Payments



A privacy-preserving Ethereum wallet using stealth addresses (ERC-5564).

Send and receive ETH without ever revealing sender, recipient, or amount on-chain.



Built for "Road to Devcon — NITK Surathkal Hackathon" · Track: 'Private Wallets and Payments'



!\[Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-8A92B2?logo=ethereum\&logoColor=white)

!\[ERC-5564](https://img.shields.io/badge/Standard-ERC--5564-67e8f9)

!\[React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?logo=react)

!\[License](https://img.shields.io/badge/License-MIT-green)



\---



🚩 The Problem



Ethereum is a fully public ledger. Every transaction, balance, and wallet address is permanently visible to

anyone. Once a wallet is linked to your identity even once, your entire financial history — salary, donations,

business payments — is exposed forever.



💡 Our Solution



BEARS lets you send and receive ETH through 'one-time stealth addresses' instead of your real wallet address.

The transaction is still fully valid and verifiable on-chain — nothing about blockchain's trust guarantees is

broken — but no outside observer can link the payment to the recipient's identity or wallet history.



⚙️ How It Works



1\. 'Recipient' generates a stealth identity (spending + viewing key pair) and shares only the public

&#x20;  'stealth meta-address'.

2\. 'Sender' pastes that meta-address and enters an amount.

3\. The app derives a fresh, one-time stealth address for this specific payment, publishes an on-chain

&#x20;  'Announcement', and sends ETH directly to it.

4\. "Recipient's" app scans Announcement events and uses their private viewing key to silently detect the

&#x20;  payment — no one else can tell it's theirs.

5\. "Recipient" derives the stealth private key and claims the funds.



🏗️ Tech Stack



| Layer | Technology |

|---|---|

| Frontend | React (Vite), Ethers.js |

| Privacy layer | \[`@scopelift/stealth-address-sdk`](https://github.com/ScopeLift/stealth-address-sdk) — canonical ERC-5564 implementation |

| Contracts | Canonical, already-deployed ERC-5564 Announcer \& ERC-6538 Registry (no custom deployment needed) |

| Network | Ethereum Sepolia Testnet |

| Wallet | MetaMask |



Deployed contract addresses (Sepolia):

\-'ERC5564Announcer': '0x55649E01B5Df198D18D95b5cc5051630cfD45564'

\- 'ERC6538Registry': '0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538'



🎬 Demo



📺 \[Watch the demo](https://github.com/user-attachments/assets/6cbcbcb9-634d-4ca2-823e-576ae89e92ef)



🚀 \[Live App](https://frontend-eight-kappa-gy6dh8gsgc.vercel.app)





| !\[screenshot](docs/screenshots/home.png) | !\[screenshot](docs/screenshots/send.png) |

| !\[screenshot](docs/screenshots/receive.png) | |



\## 🚀 Running Locally



\---bash

git clone https://github.com/Anup-Mamadapur/Private-wallet-and-privacy.git

cd Private-wallet-and-privacy/frontend

npm install

npm run dev



Open the printed local URL, connect MetaMask (set to "Sepolia" testnet), and you're in.



Environment

\---bash

cp .env.example .env

set VITE\_SEPOLIA\_RPC\_URL to your own RPC (Alchemy/Infura) for reliability

\---



🧪 Testing the Full Flow



1\. Connect Wallet A, click "Generate Stealth Identity", copy the meta-address.

2\. Connect Wallet B (or open an incognito window), paste the meta-address, send a small test amount (e.g. `0.001` ETH).

3\. Switch back to Wallet A → "Check \& Verify Payment" → "Claim / Spend Payment".

4\. Check the transaction on \[Sepolia Etherscan](https://sepolia.etherscan.io) — the stealth address has no visible link to Wallet A's real identity.



👥 Team



| Role    | Focus                                       |

| Bharat  | Smart contract \& on-chain integration       |

| Anup    | Frontend (React, wallet UX)                 |

| Sathvik | Research, integration, testing \& submission |



📄 License



MIT — see \[LICENSE](LICENSE).



\---



'Submitted to Road to Devcon — NITK Surathkal · Private Wallets and Payments track'

