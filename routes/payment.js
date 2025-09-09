// routes/payment.js
const express = require("express");
const axios = require("axios");
const Order = require("../models/Order");

const router = express.Router();
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// ✅ Initialize transaction
router.post("/initialize", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      { email, amount },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Paystack Init Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initialize transaction" });
  }
});

// ✅ Verify transaction + Save Order
router.post("/verify", async (req, res) => {
  try {
    const { reference, cart, address, total, userId } = req.body;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const data = response.data;

    if (data.data.status === "success") {
      const order = new Order({
        user: userId || null, // optional, since no auth
        cart,
        address,
        total,
        paymentReference: reference,
        status: "paid",
      });

      await order.save();
      return res.json({ success: true, order });
    }

    res.status(400).json({ success: false, error: "Payment not verified" });
  } catch (err) {
    console.error("Paystack Verify Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify transaction" });
  }
});

module.exports = router;
