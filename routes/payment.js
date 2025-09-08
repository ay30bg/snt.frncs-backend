// backend/routes/payment.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const Order = require("../models/Order"); // Assuming you have an Order model

// Paystack payment verification
const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    return response.data.data.status === "success";
  } catch (error) {
    console.error("Payment verification failed:", error.message);
    return false;
  }
};

// Create order
router.post("/orders", async (req, res) => {
  const { userId, address, cart, total, paymentReference } = req.body;

  // Validate request body
  if (!userId || !address || !cart || !total || !paymentReference) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Verify Paystack payment
  const isPaymentValid = await verifyPayment(paymentReference);
  if (!isPaymentValid) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  try {
    const order = new Order({
      userId,
      address,
      cart,
      total,
      paymentReference,
      status: "confirmed",
    });
    await order.save();
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ error: "Failed to create order", details: error.message });
  }
});

module.exports = router;
