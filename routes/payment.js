const express = require("express");
const axios = require("axios");
const router = express.Router();

// Initialize Payment
router.post("/initialize", async (req, res) => {
  try {
    const { email, amount, fullName, phone } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Convert to kobo
        currency: "NGN",
        metadata: { fullName, phone },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Payment initialization error:", error.message);
    res.status(500).json({ error: "Failed to initialize payment" });
  }
});

// Verify Payment
router.post("/verify", async (req, res) => {
  try {
    const { reference, address, cart, total } = req.body;

    if (!reference) {
      return res.status(400).json({ error: "Reference is required" });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.data.status === "success") {
      // Save order (in a real app, save to a database)
      const order = {
        address,
        cart,
        total,
        paymentReference: reference,
        paymentStatus: response.data.data.status,
        createdAt: new Date(),
      };

      // For this example, save to a JSON file (replace with database in production)
      const fs = require("fs").promises;
      const orders = JSON.parse(await fs.readFile("orders.json", { encoding: "utf8" }).catch(() => "[]"));
      orders.push(order);
      await fs.writeFile("orders.json", JSON.stringify(orders, null, 2));

      res.json({ success: true, order });
    } else {
      res.status(400).json({ error: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Payment verification error:", error.message);
    res.status(500).json({ error: "Verification error" });
  }
});

module.exports = router;
