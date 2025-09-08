// const express = require("express");
// const axios = require("axios");
// const Order = require("../models/Order");

// const router = express.Router();

// const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// // ✅ Initiate Transaction
// router.post("/initiate", async (req, res) => {
//   try {
//     const { email, amount, address, cart } = req.body;

//     const response = await axios.post(
//       "https://api.paystack.co/transaction/initialize",
//       {
//         email,
//         amount, // in kobo
//         metadata: { address, cart },
//       },
//       {
//         headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
//       }
//     );

//     res.json(response.data);
//   } catch (err) {
//     console.error("Paystack Initiate Error:", err.response?.data || err.message);
//     res
//       .status(500)
//       .json({ error: err.response?.data || "Failed to initialize payment" });
//   }
// });

// // ✅ Verify Transaction
// router.get("/verify/:reference", async (req, res) => {
//   try {
//     const { reference } = req.params;

//     const response = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       {
//         headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
//       }
//     );

//     const payment = response.data.data;

//     if (payment.status === "success") {
//       const orderData = {
//         reference: payment.reference,
//         email: payment.customer.email,
//         amount: payment.amount / 100, // convert from kobo to naira
//         cart: payment.metadata.cart,
//         address: payment.metadata.address,
//         status: "paid",
//       };

//       // ✅ Save order if not already in DB
//       let order = await Order.findOne({ reference: payment.reference });
//       if (!order) {
//         order = await Order.create(orderData);
//       }

//       res.json({ success: true, order });
//     } else {
//       res.json({ success: false });
//     }
//   } catch (err) {
//     console.error("Paystack Verify Error:", err.response?.data || err.message);
//     res
//       .status(500)
//       .json({ error: err.response?.data || "Payment verification failed" });
//   }
// });

// // ✅ Webhook (for reliability)
// router.post(
//   "/webhook",
//   express.json({ type: "application/json" }),
//   async (req, res) => {
//     const event = req.body;

//     if (event.event === "charge.success") {
//       const payment = event.data;

//       const orderData = {
//         reference: payment.reference,
//         email: payment.customer.email,
//         amount: payment.amount / 100,
//         cart: payment.metadata.cart,
//         address: payment.metadata.address,
//         status: "paid",
//       };

//       try {
//         let order = await Order.findOne({ reference: payment.reference });
//         if (!order) {
//           order = await Order.create(orderData);
//         } else {
//           order.status = "paid";
//           await order.save();
//         }
//         console.log("✅ Webhook Order Saved:", order.reference);
//       } catch (err) {
//         console.error("Webhook DB Error:", err.message);
//       }
//     }

//     res.sendStatus(200);
//   }
// );

// module.exports = router;

const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/initiate', async (req, res, next) => {
  try {
    const { email, amount, address, cart } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount required' });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        metadata: { address, cart },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Payment init error:", err.response?.data || err.message);
    next(err); // pass to error handler
  }
});

router.get('/verify/:reference', async (req, res, next) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Payment verify error:", err.response?.data || err.message);
    next(err);
  }
});

module.exports = router;

