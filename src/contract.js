export const CONTRACT_ADDRESS =
  "0xD1C4798DcFC2Fb8FA4be17F6D7E532824F9bb364";

export const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "paymentId",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "claimPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "address",
        name: "stealthAddress",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "ephemeralPublicKey",
        type: "bytes",
      },
    ],
    name: "createPayment",
    outputs: [
      {
        internalType: "bytes32",
        name: "paymentId",
        type: "bytes32",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "paymentId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "stealthAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "PaymentClaimed",
    type: "event",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "paymentId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "stealthAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "ephemeralPublicKey",
        type: "bytes",
      },
    ],
    name: "PaymentCreated",
    type: "event",
  },

  {
    inputs: [
      {
        internalType: "bytes32",
        name: "paymentId",
        type: "bytes32",
      },
    ],
    name: "getPayment",
    outputs: [
      {
        internalType: "address",
        name: "stealthAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "claimed",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "ephemeralPublicKey",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "bytes32",
        name: "paymentId",
        type: "bytes32",
      },
    ],
    name: "paymentExists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "paymentNonce",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "payments",
    outputs: [
      {
        internalType: "address",
        name: "stealthAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "claimed",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "ephemeralPublicKey",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];