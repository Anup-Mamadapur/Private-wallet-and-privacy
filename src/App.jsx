import { useEffect, useState } from "react";
import "./stitch.css";
import { ethers } from "ethers";

import {
  ERC5564_CONTRACT_ADDRESS,
  createStealthClient,
  generateRandomStealthMetaAddress,
  generateStealthAddress,
  computeStealthKey,
  checkStealthAddress,
} from "@scopelift/stealth-address-sdk";

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const SCHEME_ID = 1;
const SEPOLIA_CHAIN_ID = 11155111n;
console.log(
  "ERC-5564 Announcer:",
  ERC5564_CONTRACT_ADDRESS
);

const STORAGE_KEY = "stealth_b_identity";

// --------------------------------------------------
// APP
// --------------------------------------------------

function App() {
  // --------------------------------------------------
  // WALLET
  // --------------------------------------------------

  const [account, setAccount] = useState("");

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  const [page, setPage] = useState("home");

  // home
  // menu
  // send
  // receive

  // --------------------------------------------------
  // B IDENTITY
  // --------------------------------------------------

  const [meta, setMeta] = useState(null);

  // --------------------------------------------------
  // SEND
  // --------------------------------------------------

  const [recipientMetaAddress, setRecipientMetaAddress] =
    useState("");

  const [sendAmount, setSendAmount] = useState("");

  const [sending, setSending] = useState(false);

  const [sendResult, setSendResult] = useState(null);

  // --------------------------------------------------
  // RECEIVE
  // --------------------------------------------------

  const [paymentInfo, setPaymentInfo] = useState(null);

  const [announcementCount, setAnnouncementCount] = useState(0);

  const [checking, setChecking] = useState(false);

  const [claiming, setClaiming] = useState(false);

  const [claimTxHash, setClaimTxHash] = useState("");

  const SEPOLIA_RPC_URL =
    import.meta.env.VITE_SEPOLIA_RPC_URL ||
    "https://ethereum-sepolia-rpc.publicnode.com";

  const getStealthClient = () =>
    createStealthClient({
      chainId: 11155111,
      rpcUrl: SEPOLIA_RPC_URL,
    });

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [generating, setGenerating] = useState(false);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  const requireWallet = () => {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed."
      );
    }
  };

  const getProvider = () => {
    requireWallet();

    return new ethers.BrowserProvider(
      window.ethereum
    );
  };

  const ensureSepolia = async (provider) => {
    const network = await provider.getNetwork();

    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      throw new Error(
        "Please switch MetaMask to Sepolia."
      );
    }
  };

  // --------------------------------------------------
  // LOAD SAVED IDENTITY
  // --------------------------------------------------

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);

      if (
        parsed &&
        parsed.stealthMetaAddressURI &&
        parsed.stealthMetaAddress &&
        parsed.spendingPrivateKey &&
        parsed.viewingPrivateKey
      ) {
        setMeta({
          stealthMetaAddressURI:
            parsed.stealthMetaAddressURI,

          stealthMetaAddress:
            parsed.stealthMetaAddress,
        });

        setMessage(
          "Your saved Bears stealth identity was restored."
        );
      }
    } catch (err) {
      console.error(
        "Could not restore identity:",
        err
      );

      setError(
        "Could not restore the saved stealth identity."
      );
    }
  }, []);

  // --------------------------------------------------
  // CONNECT WALLET
  // --------------------------------------------------

  const connectWallet = async () => {
    try {
      clearStatus();

      requireWallet();

      const provider = getProvider();

      await provider.send(
        "eth_requestAccounts",
        []
      );

      await ensureSepolia(provider);

      const signer =
        await provider.getSigner();

      const address =
        await signer.getAddress();

      setAccount(address);

      setPage("menu");

      setMessage(
        "Wallet connected successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.shortMessage ||
          err?.message ||
          String(err)
      );
    }
  };

     // --------------------------------------------------
  // DISCONNECT WALLET
  // --------------------------------------------------

  const disconnectWallet = () => {
    clearStatus();

    // Disconnect the account from the Bears application.
    setAccount("");

    // Clear account-specific payment UI.
    setPaymentInfo(null);
    setClaimTxHash("");
    setAnnouncementCount(0);
    setSendResult(null);

    // Return to the Connect Wallet screen.
    setPage("home");

    setMessage(
      "Wallet disconnected from Bears."
    );
  };

  // --------------------------------------------------
  // ACCOUNT / NETWORK CHANGES
  // --------------------------------------------------

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged =
      (accounts) => {
        if (
          !accounts ||
          accounts.length === 0
        ) {
          setAccount("");
          setPage("home");
          return;
        }

        setAccount(accounts[0]);
      };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  // --------------------------------------------------
  // GENERATE B IDENTITY
  // --------------------------------------------------

  const generateBIdentity = () => {
    try {
      clearStatus();

      setGenerating(true);

      const generated =
        generateRandomStealthMetaAddress();

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          stealthMetaAddressURI:
            generated.stealthMetaAddressURI,

          stealthMetaAddress:
            generated.stealthMetaAddress,

          spendingPrivateKey:
            generated.spendingPrivateKey,

          spendingPublicKey:
            generated.spendingPublicKey,

          viewingPrivateKey:
            generated.viewingPrivateKey,
        })
      );

      setMeta({
        stealthMetaAddressURI:
          generated.stealthMetaAddressURI,

        stealthMetaAddress:
          generated.stealthMetaAddress,
      });

      setMessage(
        "Your Bears stealth identity was created. Share only the stealth meta-address with the sender."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          String(err)
      );
    } finally {
      setGenerating(false);
    }
  };

  // --------------------------------------------------
  // COPY META ADDRESS
  // --------------------------------------------------

  const copyMetaAddress = async () => {
    try {
      clearStatus();

      if (!meta) {
        throw new Error(
          "Create your stealth identity first."
        );
      }

      await navigator.clipboard.writeText(
        meta.stealthMetaAddress
      );

      setMessage(
        "Stealth meta-address copied."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          String(err)
      );
    }
  };

  // --------------------------------------------------
  // GET SAVED IDENTITY
  // --------------------------------------------------

  const getSavedIdentity = () => {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      throw new Error(
        "No Bears stealth identity exists in this browser. Create one first."
      );
    }

    const parsed =
      JSON.parse(saved);

    if (
      !parsed.spendingPrivateKey ||
      !parsed.viewingPrivateKey ||
      !parsed.stealthMetaAddress
    ) {
      throw new Error(
        "The saved stealth identity is incomplete. Create a new identity."
      );
    }

    // Older Bears identities did not save the spending public key.
    // Derive the compressed public key locally from the private key.
    if (!parsed.spendingPublicKey) {
      parsed.spendingPublicKey = ethers.SigningKey.computePublicKey(
        parsed.spendingPrivateKey,
        true
      );
    }

    return parsed;
  };

  // --------------------------------------------------
  // SEND PAYMENT — ERC-5564 FLOW
  // --------------------------------------------------

  const sendPayment = async () => {
    try {
      clearStatus();
      setSendResult(null);

      if (!recipientMetaAddress) {
        throw new Error("Enter the recipient's stealth meta-address.");
      }

      if (!sendAmount) {
        throw new Error("Enter the amount of ETH to send.");
      }

      let value;
      try {
        value = ethers.parseEther(sendAmount);
      } catch {
        throw new Error("Enter a valid ETH amount.");
      }

      if (value <= 0n) {
        throw new Error("The payment amount must be greater than zero.");
      }

      requireWallet();
      setSending(true);

      const provider = getProvider();
      await ensureSepolia(provider);
      const signer = await provider.getSigner();
      const sender = await signer.getAddress();

      setMessage("Generating stealth address...");

      const stealthMetaAddressURI = recipientMetaAddress.startsWith("st:")
        ? recipientMetaAddress
        : `st:eth:${recipientMetaAddress}`;

      const generated = generateStealthAddress({
        stealthMetaAddressURI,
        schemeId: SCHEME_ID,
      });

      const { stealthAddress, ephemeralPublicKey, viewTag } = generated;

      // ERC-5564 metadata begins with the one-byte view tag.
      const metadata = viewTag;

      // 1) Publish the ERC-5564 Announcement.
      // This does NOT hold the payment. It only publishes the discovery data.
      setMessage("Publishing ERC-5564 announcement...");

      const stealthClient = getStealthClient();
      const preparedAnnouncement = await stealthClient.prepareAnnounce({
        ERC5564Address: ERC5564_CONTRACT_ADDRESS,
        account: sender,
        args: {
          schemeId: SCHEME_ID,
          stealthAddress,
          ephemeralPublicKey,
          metadata,
        },
      });

      const announcementTx = await signer.sendTransaction({
        to: preparedAnnouncement.to,
        data: preparedAnnouncement.data,
      });

      await announcementTx.wait();

      // 2) Send ETH directly to the one-time stealth address.
      setMessage("Announcement confirmed. Sending ETH to the stealth address...");

      const paymentTx = await signer.sendTransaction({
        to: stealthAddress,
        value,
      });

      const paymentReceipt = await paymentTx.wait();

      setSendResult({
        stealthAddress,
        ephemeralPublicKey,
        viewTag,
        announcementTransactionHash: announcementTx.hash,
        transactionHash: paymentReceipt.hash,
        amount: sendAmount,
        sender,
      });

      setMessage(
        "Private payment sent. The recipient can discover it from the ERC-5564 Announcement."
      );
    } catch (err) {
      console.error("SEND ERROR:", err);

      if (err?.code === "ACTION_REJECTED") {
        setError("Transaction was rejected in MetaMask.");
      } else {
        setError(err?.shortMessage || err?.message || String(err));
      }
    } finally {
      setSending(false);
    }
  };

  // --------------------------------------------------
  // SCAN ERC-5564 ANNOUNCEMENTS
  // --------------------------------------------------

  const checkPayment = async () => {
  try {
    clearStatus();
    setPaymentInfo(null);
    setClaimTxHash("");

    requireWallet();
    setChecking(true);

    const provider = getProvider();
    await ensureSepolia(provider);

    const identity = getSavedIdentity();

    const latestBlock = BigInt(
      await provider.getBlockNumber()
    );

    const deploymentBlock = 5486597n;
    const chunkSize = 10_000n;
    const maxRecentBlocks = 200_000n;

    const minimumBlock =
      latestBlock > maxRecentBlocks
        ? latestBlock - maxRecentBlocks + 1n
        : deploymentBlock;

    setMessage(
      `Preparing ERC-5564 scan from block ${minimumBlock} to ${latestBlock}...`
    );

    const announcementInterface = new ethers.Interface([
      "event Announcement(uint256 indexed schemeId,address indexed stealthAddress,address indexed caller,bytes ephemeralPubKey,bytes metadata)"
    ]);

    const announcementTopic = ethers.id(
      "Announcement(uint256,address,address,bytes,bytes)"
    );

    let scanTo = latestBlock;
    let scannedCount = 0;

    while (scanTo >= minimumBlock) {
      const scanFrom =
        scanTo - chunkSize + 1n > minimumBlock
          ? scanTo - chunkSize + 1n
          : minimumBlock;

      setMessage(
        `Scanning ERC-5564 announcements (blocks ${scanFrom}–${scanTo})...`
      );

      const logs = await provider.getLogs({
        address: ERC5564_CONTRACT_ADDRESS,
        fromBlock: Number(scanFrom),
        toBlock: Number(scanTo),
        topics: [announcementTopic],
      });

      scannedCount += logs.length;
      setAnnouncementCount(scannedCount);

      console.log(
        `ERC-5564 scan ${scanFrom}-${scanTo}:`,
        logs.length,
        "announcement(s)"
      );

      if (logs.length > 0) {
        console.log("ERC-5564 raw logs:", logs);

        for (const log of logs) {
          let parsed;

          try {
            parsed =
              announcementInterface.parseLog({
                topics: log.topics,
                data: log.data,
              });
          } catch (parseError) {
            console.error(
              "Could not parse announcement:",
              parseError
            );
            continue;
          }

          if (!parsed) {
            continue;
          }

          const schemeId =
            BigInt(parsed.args.schemeId);

          if (schemeId !== BigInt(SCHEME_ID)) {
            continue;
          }

          const stealthAddress =
            parsed.args.stealthAddress;

          const ephemeralPublicKey =
            parsed.args.ephemeralPubKey;

          const metadata =
            parsed.args.metadata;

          console.log(
            "Parsed ERC-5564 announcement:",
            {
              schemeId: schemeId.toString(),
              stealthAddress,
              ephemeralPublicKey,
              metadata,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            }
          );

          // The first byte of metadata is the ERC-5564 view tag.
          const viewTag = metadata.slice(0, 4);

          let belongsToUser = false;

          try {
            belongsToUser = checkStealthAddress({
              ephemeralPublicKey,
              schemeId: SCHEME_ID,
              spendingPublicKey:
                identity.spendingPublicKey,
              userStealthAddress:
                stealthAddress,
              viewingPrivateKey:
                identity.viewingPrivateKey,
              viewTag,
            });
          } catch (checkError) {
            console.error(
              "Stealth ownership check failed:",
              checkError
            );
            continue;
          }

          console.log(
            "Belongs to Bears identity:",
            belongsToUser
          );

          if (!belongsToUser) {
            continue;
          }

          setMessage(
            "Payment announcement found. Checking stealth-address balance..."
          );

          const balance =
            await provider.getBalance(
              stealthAddress
            );

          const amount =
            ethers.formatEther(balance);

          const claimed =
            balance === 0n;

          let derivedAddress = "";
          let stealthPrivateKey = "";

          if (!claimed) {
            stealthPrivateKey =
              computeStealthKey({
                ephemeralPublicKey,
                schemeId: SCHEME_ID,
                spendingPrivateKey:
                  identity.spendingPrivateKey,
                viewingPrivateKey:
                  identity.viewingPrivateKey,
              });

            const derivedWallet =
              new ethers.Wallet(
                stealthPrivateKey
              );

            derivedAddress =
              derivedWallet.address;

            if (
              derivedAddress.toLowerCase() !==
              stealthAddress.toLowerCase()
            ) {
              throw new Error(
                "The derived stealth address does not match the ERC-5564 announcement."
              );
            }
          }

          setPaymentInfo({
            stealthAddress,
            amount,
            claimed,
            ephemeralPublicKey,
            metadata,
            announcementTransactionHash:
              log.transactionHash,
            announcementBlockNumber:
              log.blockNumber?.toString(),
            derivedAddress,
            belongsToB: true,
          });

          setMessage(
            claimed
              ? "A matching stealth address was found, but it currently has no ETH."
              : "Payment found and verified as belonging to your Bears identity."
          );

          return;
        }
      }

      if (scanFrom === minimumBlock) {
        break;
      }

      scanTo = scanFrom - 1n;
    }

    throw new Error(
      `No recent ERC-5564 payment belonging to this Bears identity was found. The scanner found ${scannedCount} ERC-5564 announcement(s).`
    );

  } catch (err) {
    console.error("SCAN ERROR:", err);

    setError(
      err?.shortMessage ||
      err?.message ||
      String(err)
    );
  } finally {
    setChecking(false);
  }
};

  // --------------------------------------------------
  // CLAIM / SPEND FROM STEALTH ADDRESS
  // --------------------------------------------------

  const claimPayment = async () => {
    try {
      clearStatus();
      setClaimTxHash("");

      if (!paymentInfo?.belongsToB) {
        throw new Error("Scan and verify a payment belonging to this identity first.");
      }

      requireWallet();
      setClaiming(true);

      const provider = getProvider();
      await ensureSepolia(provider);

      const recipientSigner = await provider.getSigner();
      const recipient = await recipientSigner.getAddress();
      setAccount(recipient);

      const identity = getSavedIdentity();

      setMessage("Deriving the stealth private key...");

      const stealthPrivateKey = computeStealthKey({
        ephemeralPublicKey: paymentInfo.ephemeralPublicKey,
        schemeId: SCHEME_ID,
        spendingPrivateKey: identity.spendingPrivateKey,
        viewingPrivateKey: identity.viewingPrivateKey,
      });

      const stealthWallet = new ethers.Wallet(
        stealthPrivateKey,
        provider
      );

      if (stealthWallet.address.toLowerCase() !== paymentInfo.stealthAddress.toLowerCase()) {
        throw new Error(
          "Derived stealth wallet does not match the announced stealth address."
        );
      }

      const balance = await provider.getBalance(stealthWallet.address);
      if (balance === 0n) {
        throw new Error("The stealth address has no ETH to spend.");
      }

      setMessage("Estimating gas and preparing the stealth-address transfer...");

      const feeData = await provider.getFeeData();
      // A stealth address generated by Scheme 1 is an EOA, so a standard
      // ETH transfer uses 21,000 gas. Estimating with the full balance can
      // fail because the estimate itself includes the gas cost.
      const gasLimit = 21000n;

      const feePerGas = feeData.maxFeePerGas ?? feeData.gasPrice;
      if (!feePerGas) {
        throw new Error("Could not determine the current Sepolia gas price.");
      }

      const gasCost = gasLimit * feePerGas;

      if (balance <= gasCost) {
        throw new Error("The stealth address does not contain enough ETH to pay its own gas fee.");
      }

      const valueToSend = balance - gasCost;

      setMessage("Confirm the stealth-address transfer in MetaMask if prompted...");

      const tx = await stealthWallet.sendTransaction({
        to: recipient,
        value: valueToSend,
        ...(feeData.maxFeePerGas && feeData.maxPriorityFeePerGas
          ? {
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            }
          : { gasPrice: feeData.gasPrice }),
      });

      setMessage("Stealth transfer submitted. Waiting for confirmation...");

      const receipt = await tx.wait();
      setClaimTxHash(receipt.hash);

      setPaymentInfo((previous) => ({
        ...previous,
        claimed: true,
        amount: "0",
      }));

      setMessage(
        `Stealth payment spent successfully. The remaining ETH was transferred to ${recipient}.`
      );
    } catch (err) {
      console.error("CLAIM ERROR:", err);

      if (err?.code === "ACTION_REJECTED") {
        setError("Transaction was rejected in MetaMask.");
      } else {
        setError(err?.shortMessage || err?.message || String(err));
      }
    } finally {
      setClaiming(false);
    }
  };

  // --------------------------------------------------
  // CLEAR IDENTITY
  // --------------------------------------------------

  const clearIdentity = () => {
    localStorage.removeItem(
      STORAGE_KEY
    );

    setMeta(null);

    setPaymentInfo(null);

    setAnnouncementCount(0);

    setClaimTxHash("");

    setError("");

    setMessage(
      "Your saved Bears stealth identity was removed from this browser."
    );
  };

  // --------------------------------------------------
  // RESET SEND
  // --------------------------------------------------

  const resetSend = () => {
    setRecipientMetaAddress("");

    setSendAmount("");

    setSendResult(null);

    clearStatus();
  };

  // --------------------------------------------------
  // RESET RECEIVE
  // --------------------------------------------------

  const resetReceive = () => {
    setPaymentInfo(null);

    setAnnouncementCount(0);

    setClaimTxHash("");

    clearStatus();
  };

  // --------------------------------------------------
  // STYLES
  // --------------------------------------------------

  const pageStyle = {
    minHeight: "100vh",

    background:
      "linear-gradient(135deg, #080b12 0%, #111827 100%)",

    color: "#ffffff",

    padding: "40px 20px",

    fontFamily:
      "Arial, sans-serif",
  };

  const containerStyle = {
    maxWidth: "950px",

    margin: "0 auto",
  };

  const cardStyle = {
    background: "#151b29",

    border:
      "1px solid #273244",

    borderRadius: "16px",

    padding: "28px",

    marginTop: "24px",
  };

  const primaryButtonStyle = {
    padding:
      "13px 22px",

    borderRadius: "9px",

    border: "none",

    cursor: "pointer",

    fontSize: "16px",

    fontWeight: "bold",

    background: "#ffffff",

    color: "#111827",
  };

  const secondaryButtonStyle = {
    padding:
      "13px 22px",

    borderRadius: "9px",

    border:
      "1px solid #374151",

    cursor: "pointer",

    fontSize: "16px",

    fontWeight: "bold",

    background: "#111827",

    color: "#ffffff",
  };

  const inputStyle = {
    width: "100%",

    boxSizing: "border-box",

    padding: "13px",

    marginBottom: "14px",

    borderRadius: "9px",

    border:
      "1px solid #374151",

    background: "#080c14",

    color: "#ffffff",

    fontSize: "16px",
  };

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  const Status = () => (
    <>
      {message && (
        <div
          style={{
            marginTop: "20px",

            padding: "15px",

            background: "#10251a",

            border:
              "1px solid #1f5130",

            borderRadius: "9px",

            color: "#9be7b1",

            wordBreak:
              "break-word",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "20px",

            padding: "15px",

            background: "#3b1111",

            border:
              "1px solid #7f1d1d",

            borderRadius: "9px",

            color: "#ffaaaa",

            wordBreak:
              "break-word",
          }}
        >
          <strong>
            Error:
          </strong>{" "}
          {error}
        </div>
      )}
    </>
  );

  // --------------------------------------------------
  // HOME
  // --------------------------------------------------

  if (page === "home") {
    return (
      <div className="stealth-vault">

        <header className="sv-header">

        <div className="sv-brand">

          <div className="sv-brand-mark">
            <span>🐻</span>
          </div>

          <span>BEARS</span>

        </div>

        <div className="sv-header-right">

          <div className="sv-pill">
            <span className="sv-dot"></span>
            ETHEREUM
          </div>

          {account && (
            <div className="sv-pill sv-wallet">
              {account.slice(0, 6)}...
              {account.slice(-4)}
            </div>
          )}

          {account && (
            <button
              type="button"
              onClick={disconnectWallet}
              style={{
                display: "inline-flex",
alignItems: "center",
justifyContent: "center",
padding: "9px 14px",
borderRadius: "8px",
border: "1px solid #7f1d1d",
background: "#241217",
color: "#ffaaaa",
cursor: "pointer",
fontSize: "13px",
fontWeight: "600",
whiteSpace: "nowrap",
position: "relative",
zIndex: 1000
              }}
            >
              Disconnect
            </button>
          )}

        </div>

      </header>

        <main className="sv-container">

          <section className="sv-hero">

            <div className="sv-eyebrow">
              🔐 ERC-5564 PRIVACY INFRASTRUCTURE
            </div>

            <h1>
              Private payments.
              <br />
              Without the link.
            </h1>

            <p>
              A privacy-focused Ethereum wallet using
              stealth addresses to keep payment
              relationships private.
            </p>

          </section>

          <div className="sv-grid">

            <div className="sv-col-12">

              <div className="sv-card">

                <div className="sv-security">

                  <div>

                    <div className="sv-card-label">
                      Security Status
                    </div>

                    <div className="sv-card-title">
                      ERC-5564 Stealth Payment System
                    </div>

                    <div className="sv-card-subtitle">
                      Privacy-preserving payment infrastructure
                      for Ethereum.
                    </div>

                  </div>

                  <div className="sv-security-status">

                    <div className="sv-security-icon">
                      🛡️
                    </div>

                    Protected

                  </div>

                </div>

              </div>

            </div>

            <div className="sv-col-12">

              <div
                className="sv-card"
                style={{ textAlign: "center" }}
              >

                <div className="sv-card-label">
                  PRIVATE WALLET
                </div>

                <div className="sv-card-title">
                  Connect your wallet
                </div>

                <div className="sv-card-subtitle">
                  Connect MetaMask to create and manage
                  private Ethereum payments.
                </div>

                <button
                  className="sv-button sv-button-primary"
                  onClick={connectWallet}
                  style={{
                    marginTop: "22px",
                    minWidth: "220px"
                  }}
                >
                  🔗 Connect Wallet
                </button>

              </div>

            </div>

            <div className="sv-col-4">

              <div className="sv-card">

                <div className="sv-security-icon">
                  🔐
                </div>

                <div className="sv-card-title">
                  Stealth Addresses
                </div>

                <div className="sv-card-subtitle">
                  Payments use unique stealth addresses
                  instead of exposing your main wallet.
                </div>

              </div>

            </div>

            <div className="sv-col-4">

              <div className="sv-card">

                <div className="sv-security-icon">
                  🗝️
                </div>

                <div className="sv-card-title">
                  Cryptographic Privacy
                </div>

                <div className="sv-card-subtitle">
                  ERC-5564 enables private recipient
                  identification through cryptography.
                </div>

              </div>

            </div>

            <div className="sv-col-4">

              <div className="sv-card">

                <div className="sv-security-icon">
                  ⛓️
                </div>

                <div className="sv-card-title">
                  Ethereum Native
                </div>

                <div className="sv-card-subtitle">
                  Built to interact directly with the
                  Ethereum blockchain.
                </div>

              </div>

            </div>

          </div>

          <footer className="sv-footer">
            BEARS · PRIVATE ETHEREUM PAYMENTS · ERC-5564
          </footer>

        </main>

      </div>
    );
  }

  // --------------------------------------------------
  // MENU
  // --------------------------------------------------

  if (page === "menu") {
    return (
      <div className="stealth-vault">

        {/* HEADER */}
        <header className="sv-header">

          <div className="sv-brand">
            <div className="sv-brand-mark">
              <span>🐻</span>
            </div>

            <span>BEARS</span>
          </div>

          <div className="sv-header-right">

            <div className="sv-pill">
              <span className="sv-dot"></span>
              ETHEREUM
            </div>

            {account && (
              <div className="sv-pill sv-wallet">
                {account.slice(0, 6)}...
                {account.slice(-4)}
              </div>
            )}

            {account && (
              <button
                type="button"
                onClick={disconnectWallet}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1px solid #7f1d1d",
                  background: "#241217",
                  color: "#ffaaaa",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  position: "relative",
                  zIndex: 1000
                }}
              >
                Disconnect
              </button>
            )}

          </div>

        </header>


        {/* MAIN */}
        <main className="sv-container">

          <section className="sv-hero">

            <div className="sv-eyebrow">
              🔐 PRIVATE PAYMENTS
            </div>

            <h1>
              Private money.
              <br />
              Simple by design.
            </h1>

            <p>
              Send and receive Ethereum privately
              using ERC-5564 stealth addresses.
            </p>

          </section>


          <div className="sv-grid">

            {/* SECURITY */}

            <div className="sv-col-12">

              <div className="sv-card">

                <div className="sv-security">

                  <div>

                    <div className="sv-card-label">
                      SECURITY STATUS
                    </div>

                    <div className="sv-card-title">
                      Private payments are protected
                    </div>

                    <div className="sv-card-subtitle">
                      Bears uses stealth addresses to
                      help keep payment relationships
                      private.
                    </div>

                  </div>

                  <div className="sv-security-status">

                    <div className="sv-security-icon">
                      🛡️
                    </div>

                    Protected

                  </div>

                </div>

              </div>

            </div>


            {/* ACTION TITLE */}

            <div className="sv-col-12">

              <div
                style={{
                  marginTop: "12px",
                  marginBottom: "4px"
                }}
              >

                <div className="sv-card-label">
                  PRIVATE PAYMENTS
                </div>

                <div
                  className="sv-card-title"
                  style={{
                    fontSize: "26px"
                  }}
                >
                  What would you like to do?
                </div>

              </div>

            </div>


            {/* SEND */}

            <div className="sv-col-6">

              <div className="sv-card sv-action-card">

                <div className="sv-security-icon">
                  ↗
                </div>

                <div className="sv-card-label">
                  SEND
                </div>

                <div className="sv-card-title">
                  Send Privately
                </div>

                <div className="sv-card-subtitle">
                  Send ETH to someone without
                  directly exposing their main
                  wallet address.
                </div>

                <button
                  className="sv-button sv-button-primary sv-button-full"
                  onClick={() => {
                    clearStatus();
                    setPage("send");
                  }}
                >
                  Send Money →
                </button>

              </div>

            </div>


            {/* RECEIVE */}

            <div className="sv-col-6">

              <div className="sv-card sv-action-card">

                <div className="sv-security-icon">
                  ↙
                </div>

                <div className="sv-card-label">
                  RECEIVE
                </div>

                <div className="sv-card-title">
                  Receive Privately
                </div>

                <div className="sv-card-subtitle">
                  Find private payments sent to
                  your stealth identity and claim
                  your ETH securely.
                </div>

                <button
                  className="sv-button sv-button-primary sv-button-full"
                  onClick={() => {
                    clearStatus();
                    setPage("receive");
                  }}
                >
                  Receive Money →
                </button>

              </div>

            </div>


            {/* TRUST MESSAGE */}

            <div className="sv-col-12">

              <div
                className="sv-message"
                style={{
                  textAlign: "center",
                  color: "#94a3b8"
                }}
              >
                🔒 Your payment privacy is built into
                the transaction flow.
              </div>

            </div>


            {/* STATUS */}

            <div className="sv-col-12">
              <Status />
            </div>

          </div>


          <footer className="sv-footer">
            BEARS · PRIVATE ETHEREUM PAYMENTS · ERC-5564
          </footer>

        </main>

      </div>
    );
  }

  // --------------------------------------------------
  // SEND PAGE
  // --------------------------------------------------

  if (page === "send") {
    return (
      <div className="stealth-vault">

        {/* HEADER */}
        <header className="sv-header">

          <div className="sv-brand">
            <div className="sv-brand-mark">
              <span>🐻</span>
            </div>

            <span>BEARS</span>
          </div>

          <div className="sv-header-right">

            <div className="sv-pill">
              <span className="sv-dot"></span>
              ERC-5564
            </div>

            {account && (
              <div className="sv-pill sv-wallet">
                {account.slice(0, 6)}...
                {account.slice(-4)}
              </div>
            )}

            {account && (
              <button
                type="button"
                onClick={disconnectWallet}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1px solid #7f1d1d",
                  background: "#241217",
                  color: "#ffaaaa",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  position: "relative",
                  zIndex: 1000
                }}
              >
                Disconnect
              </button>
            )}

          </div>

        </header>


        <main className="sv-container">

          {/* PAGE HEADER */}
          <section className="sv-hero">

            <div className="sv-eyebrow">
              🔐 PRIVATE TRANSFER
            </div>

            <h1>
              Send privately.
              <br />
              Break the link.
            </h1>

            <p>
              Send ETH using an ERC-5564 stealth
              address without publicly linking the
              payment to the recipient's main wallet.
            </p>

          </section>


          <div className="sv-grid">

            {/* SEND FORM */}
            <div className="sv-col-8">

              <div className="sv-card">

                <div className="sv-card-label">
                  PRIVATE PAYMENT
                </div>

                <div className="sv-card-title">
                  Send ETH privately
                </div>

                <div className="sv-card-subtitle">
                  Enter the recipient's stealth
                  meta-address and the amount to send.
                </div>


                {/* RECIPIENT */}

                <div className="sv-form-group">

                  <label className="sv-label">
                    RECIPIENT META-ADDRESS
                  </label>

                  <input
                    type="text"
                    className="sv-input"
                    placeholder="Enter recipient stealth meta-address"
                    value={recipientMetaAddress}
                    onChange={(e) =>
                      setRecipientMetaAddress(
                        e.target.value
                      )
                    }
                  />

                </div>


                {/* AMOUNT */}

                <div className="sv-form-group">

                  <label className="sv-label">
                    AMOUNT
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    className="sv-input"
                    placeholder="0.001"
                    value={sendAmount}
                    onChange={(e) =>
                      setSendAmount(
                        e.target.value
                      )
                    }
                  />

                </div>


                {/* SECURITY NOTICE */}

                <div
                  className="sv-message"
                  style={{
                    color: "#67e8f9",
                    background:
                      "rgba(103, 232, 249, 0.05)",
                    border:
                      "1px solid rgba(103, 232, 249, 0.12)"
                  }}
                >
                  🔐 A unique stealth address will
                  be generated for this payment.
                  The recipient's main wallet address
                  is not directly exposed.
                </div>


                {/* SEND */}

                <button
                  className="sv-button sv-button-primary sv-button-full"
                  onClick={sendPayment}
                  disabled={sending}
                >
                  {sending
                    ? "⏳ Sending Private Payment..."
                    : "🔐 Send Private Payment"}
                </button>


                {/* BACK */}

                <button
                  className="sv-button sv-button-full"
                  onClick={() => {
                    clearStatus();
                    setPage("menu");
                  }}
                >
                  ← Back to Vault
                </button>

              </div>

            </div>


            {/* PRIVACY INFORMATION */}

            <div className="sv-col-4">

              <div className="sv-card">

                <div className="sv-security-icon">
                  🛡️
                </div>

                <div className="sv-card-label">
                  PRIVACY LAYER
                </div>

                <div className="sv-card-title">
                  Protected Transfer
                </div>

                <div className="sv-card-subtitle">
                  Your payment uses the ERC-5564
                  stealth-address flow.
                </div>


                <div className="sv-address-box">

                  <div
                    style={{
                      color: "#64748b",
                      marginBottom: "8px"
                    }}
                  >
                    PAYMENT FLOW
                  </div>

                  Recipient Meta-Address
                  <br />
                  ↓
                  <br />
                  Stealth Address
                  <br />
                  ↓
                  <br />
                  Ethereum Transaction
                  <br />
                  ↓
                  <br />
                  Private Payment

                </div>

              </div>

            </div>


            {/* RESULT */}

            {sendResult && (
              <div className="sv-col-12">

                <div className="sv-card">

                  <div className="sv-security-status">
                    <div className="sv-security-icon">
                      ✓
                    </div>

                    Payment Created
                  </div>

                  <div className="sv-card-title">
                    ERC-5564 announcement created
                  </div>

                  <div className="sv-card-subtitle">
                    Your private payment transaction
                    has been submitted.
                  </div>

                  <div className="sv-address-box">
                    <strong>
                      Announcement Transaction
                    </strong>

                    <br />
                    <br />

                    {sendResult.txHash ||
                      sendResult.announcementTx ||
                      JSON.stringify(
                        sendResult,
                        null,
                        2
                      )}
                  </div>

                </div>

              </div>
            )}


            {/* STATUS */}

            <div className="sv-col-12">
              <Status />
            </div>

          </div>


          <footer className="sv-footer">
            BEARS · PRIVATE ETHEREUM PAYMENTS · ERC-5564
          </footer>

        </main>

      </div>
    );
  }

  // --------------------------------------------------
  // RECEIVE PAGE
  // --------------------------------------------------

  if (page === "receive") {
    return (
      <div className="stealth-vault">

        {/* HEADER */}
        <header className="sv-header">

          <div className="sv-brand">
            <div className="sv-brand-mark">
              <span>🐻</span>
            </div>

            <span>BEARS</span>
          </div>

          <div className="sv-header-right">

            <div className="sv-pill">
              <span className="sv-dot"></span>
              PRIVATE RECEIVE
            </div>

            {account && (
              <div className="sv-pill sv-wallet">
                {account.slice(0, 6)}...
                {account.slice(-4)}
              </div>
            )}

            {account && (
              <button
                type="button"
                onClick={disconnectWallet}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1px solid #7f1d1d",
                  background: "#241217",
                  color: "#ffaaaa",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  position: "relative",
                  zIndex: 1000
                }}
              >
                Disconnect
              </button>
            )}

          </div>

        </header>


        <main className="sv-container">
         
         <div style={{ marginBottom: "24px" }}>
  <button
    className="sv-button"
    onClick={() => {
      clearStatus();
      setPage("menu");
    }}
  >
    ← Back to Vault
  </button>
</div>   
        
          {/* PAGE HEADER */}

          <section className="sv-hero">

            <div className="sv-eyebrow">
              🔐 PRIVATE RECEIVING
            </div>

            <h1>
              Receive privately.
              <br />
              Claim securely.
            </h1>

            <p>
              Use your ERC-5564 stealth identity
              to detect and claim private Ethereum
              payments.
            </p>

          </section>


          <div className="sv-grid">

            {/* STEALTH IDENTITY */}

            <div className="sv-col-8">

              <div className="sv-card">

                <div className="sv-card-label">
                  STEP 01 · STEALTH IDENTITY
                </div>

                <div className="sv-card-title">
                  Your private receiving identity
                </div>

                <div className="sv-card-subtitle">
                  Share this stealth meta-address with
                  someone who wants to send you a private
                  payment. Your private keys remain local.
                </div>


                {!meta && (
                  <button
                    className="sv-button sv-button-primary sv-button-full"
                    onClick={generateBIdentity}
                    disabled={generating}
                  >
                    {generating
                      ? "⏳ Creating Identity..."
                      : "🔐 Create Stealth Identity"}
                  </button>
                )}


                {meta && (
                  <>
                    <div className="sv-address-box">

                      <div
                        style={{
                          color: "#64748b",
                          marginBottom: "8px"
                        }}
                      >
                        YOUR STEALTH META-ADDRESS
                      </div>

                      {meta.stealthMetaAddress}

                    </div>


                    <div className="sv-address-actions">

                      <button
                        className="sv-button sv-button-primary"
                        onClick={copyMetaAddress}
                      >
                        📋 Copy Meta-Address
                      </button>

                      <button
                        className="sv-button sv-button-danger"
                        onClick={clearIdentity}
                      >
                        Clear Identity
                      </button>

                    </div>


                    <div
                      className="sv-message"
                      style={{
                        color: "#67e8f9",
                        background:
                          "rgba(103, 232, 249, 0.05)",
                        border:
                          "1px solid rgba(103, 232, 249, 0.12)"
                      }}
                    >
                      🔒 Your private spending and
                      viewing keys remain in this browser
                      and are never shared with the sender.
                    </div>

                  </>
                )}

              </div>

            </div>


            {/* SECURITY STATUS */}

            <div className="sv-col-4">

              <div className="sv-card">

                <div className="sv-security-icon">
                  🛡️
                </div>

                <div className="sv-card-label">
                  SECURITY
                </div>

                <div className="sv-card-title">
                  Keys stay private
                </div>

                <div className="sv-card-subtitle">
                  The sender only receives your stealth
                  meta-address. Your private keys never
                  leave this browser.
                </div>

                <div
                  className="sv-security-status"
                  style={{
                    marginTop: "20px"
                  }}
                >
                  <span className="sv-dot"></span>
                  Protected
                </div>

              </div>

            </div>


            {/* PAYMENT DETECTION */}

            <div className="sv-col-12">

              <div className="sv-card">

                <div className="sv-card-label">
                  STEP 02 · PAYMENT DETECTION
                </div>

                <div className="sv-card-title">
                  Scan for private payments
                </div>

                <div className="sv-card-subtitle">
                  Bears scans ERC-5564 Announcer events
                  and cryptographically checks whether
                  an announcement belongs to your
                  stealth identity.
                </div>


                <div
                  className="sv-address-box"
                  style={{
                    marginTop: "20px"
                  }}
                >
                  <strong>
                    ANNOUNCEMENTS SCANNED
                  </strong>

                  <br />

                  <span
                    style={{
                      fontSize: "24px",
                      color: "#f8fafc"
                    }}
                  >
                    {announcementCount}
                  </span>

                  <br />

                  <span
                    style={{
                      color: "#64748b"
                    }}
                  >
                    ERC-5564 announcements checked
                  </span>
                </div>


                <button
                  className="sv-button sv-button-primary"
                  onClick={checkPayment}
                  disabled={checking}
                  style={{
                    marginTop: "20px"
                  }}
                >
                  {checking
                    ? "⏳ Scanning Announcements..."
                    : "🔎 Check & Verify Payment"}
                </button>

              </div>

            </div>


            {/* PAYMENT FOUND */}

            {paymentInfo && (
              <div className="sv-col-12">

                <div className="sv-card">

                  <div className="sv-security-status">

                    <div className="sv-security-icon">
                      {paymentInfo.belongsToB
                        ? "✓"
                        : "!"}
                    </div>

                    {paymentInfo.belongsToB
                      ? "Payment matched"
                      : "Payment not matched"}

                  </div>


                  <div className="sv-card-label">
                    STEP 03 · PAYMENT DETECTED
                  </div>

                  <div className="sv-card-title">
                    {paymentInfo.belongsToB
                      ? "Private payment found"
                      : "Payment does not belong to this identity"}
                  </div>


                  <div className="sv-grid">

                    {/* AMOUNT */}

                    <div className="sv-col-6">

                      <div className="sv-card">

                        <div className="sv-card-label">
                          AMOUNT
                        </div>

                        <div className="sv-balance">
                          {paymentInfo.amount}
                          <span className="sv-balance-unit">
                            ETH
                          </span>
                        </div>

                      </div>

                    </div>


                    {/* CLAIM STATUS */}

                    <div className="sv-col-6">

                      <div className="sv-card">

                        <div className="sv-card-label">
                          CLAIM STATUS
                        </div>

                        <div className="sv-card-title">
                          {paymentInfo.claimed
                            ? "✓ Already Claimed"
                            : "● Available to Claim"}
                        </div>

                        <div className="sv-card-subtitle">
                          Belongs to this identity:{" "}
                          {paymentInfo.belongsToB
                            ? "Yes"
                            : "No"}
                        </div>

                      </div>

                    </div>


                    {/* STEALTH ADDRESS */}

                    <div className="sv-col-12">

                      <div className="sv-address-box">

                        <div
                          style={{
                            color: "#64748b",
                            marginBottom: "8px"
                          }}
                        >
                          STEALTH ADDRESS
                        </div>

                        {paymentInfo.stealthAddress}

                      </div>

                    </div>


                    {/* CLAIM */}

                    {paymentInfo.belongsToB &&
                      !paymentInfo.claimed && (
                        <div className="sv-col-12">

                          <div
                            className="sv-message sv-message-success"
                          >
                            ✓ Payment successfully matched
                            to your stealth identity.
                          </div>

                          <button
                            className="sv-button sv-button-primary sv-button-full"
                            onClick={claimPayment}
                            disabled={claiming}
                          >
                            {claiming
                              ? "⏳ Claiming Payment..."
                              : "🔓 Claim Payment"}
                          </button>

                          <div
                            className="sv-card-subtitle"
                            style={{
                              marginTop: "14px",
                              textAlign: "center"
                            }}
                          >
                            The claim is signed by the
                            derived stealth private key.
                            ETH is transferred from the
                            one-time stealth address to
                            your connected wallet.
                          </div>

                        </div>
                      )}


                    {!paymentInfo.belongsToB &&
                      !paymentInfo.claimed && (
                        <div className="sv-col-12">

                          <div
                            className="sv-message sv-message-error"
                          >
                            This payment does not belong
                            to the currently saved Bears
                            identity.
                          </div>

                        </div>
                      )}

                  </div>

                </div>

              </div>
            )}


            {/* STATUS */}

            <div className="sv-col-12">
              <Status />
            </div>

          </div>


          <footer className="sv-footer">
            BEARS · PRIVATE ETHEREUM PAYMENTS · ERC-5564
          </footer>

        </main>

      </div>
    );
  }

  return null;
}

export default App;