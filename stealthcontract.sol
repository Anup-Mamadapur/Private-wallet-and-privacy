// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract StealthPayment {

    struct Payment {
        address stealthAddress;
        uint256 amount;
        bool claimed;
    }

    // paymentId => Payment
    mapping(bytes32 => Payment) public payments;

    // Used to make automatically generated IDs unique
    uint256 public paymentNonce;

    event PaymentCreated(
        bytes32 indexed paymentId,
        address indexed stealthAddress,
        uint256 amount
    );

    event PaymentClaimed(
        bytes32 indexed paymentId,
        address indexed stealthAddress,
        uint256 amount
    );

    /**
     * @notice Create a private payment
     * @param stealthAddress The stealth address generated for the recipient
     *
     * The paymentId is generated automatically.
     */
    function createPayment(
        address stealthAddress
    )
        external
        payable
        returns (bytes32 paymentId)
    {
        require(msg.value > 0, "Send ETH");
        require(
            stealthAddress != address(0),
            "Invalid stealth address"
        );

        // Automatically generate unique payment ID
        paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                stealthAddress,
                msg.value,
                paymentNonce
            )
        );

        paymentNonce++;

        payments[paymentId] = Payment({
            stealthAddress: stealthAddress,
            amount: msg.value,
            claimed: false
        });

        emit PaymentCreated(
            paymentId,
            stealthAddress,
            msg.value
        );
    }

    /**
     * @notice Claim a payment
     * @param paymentId Automatically generated payment ID
     */
    function claimPayment(
        bytes32 paymentId
    )
        external
    {
        Payment storage payment = payments[paymentId];

        require(
            payment.amount > 0,
            "Payment does not exist"
        );

        require(
            !payment.claimed,
            "Already claimed"
        );

        require(
            msg.sender == payment.stealthAddress,
            "Not stealth address"
        );

        uint256 amount = payment.amount;

        // Mark claimed BEFORE transfer
        payment.claimed = true;

        (bool success, ) = payable(msg.sender).call{
            value: amount
        }("");

        require(
            success,
            "ETH transfer failed"
        );

        emit PaymentClaimed(
            paymentId,
            msg.sender,
            amount
        );
    }

    /**
     * @notice Get payment information
     */
    function getPayment(
        bytes32 paymentId
    )
        external
        view
        returns (
            address stealthAddress,
            uint256 amount,
            bool claimed
        )
    {
        Payment memory payment = payments[paymentId];

        return (
            payment.stealthAddress,
            payment.amount,
            payment.claimed
        );
    }

    /**
     * @notice Check whether a payment exists
     */
    function paymentExists(
        bytes32 paymentId
    )
        external
        view
        returns (bool)
    {
        return payments[paymentId].amount > 0;
    }
}
// NOTE: This is the legacy Bears demo contract. The current frontend no longer
// uses it for ERC-5564 payments. Keep it as a backup/reference until the new
// ERC-5564 flow has been tested end-to-end on Sepolia.
