// routes/payment.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// 🔹 Initialize Payment
router.post("/initiate", async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack expects amount in kobo
        metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data); // Send Paystack response to frontend
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// 🔹 Verify Payment
router.get("/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// 🔹 Webhook (recommended for real-time updates)
router.post("/webhook", (req, res) => {
  const event = req.body;

  // ⚠️ IMPORTANT: Verify Paystack signature before trusting the event
  if (event.event === "charge.success") {
    console.log("✅ Payment Successful:", event.data.reference);
    // Save order to DB here
  }

  res.sendStatus(200);
});

export default router;
