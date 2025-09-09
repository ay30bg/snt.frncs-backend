// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const Order = require('../models/Order');

// // Paystack API base URL
// const PAYSTACK_API = 'https://api.paystack.co';
// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// // Middleware to verify Paystack signature (for webhooks)
// const verifyPaystackSignature = (req, res, next) => {
//   const crypto = require('crypto');
//   const secret = PAYSTACK_SECRET_KEY;
//   const hash = crypto
//     .createHmac('sha512', secret)
//     .update(JSON.stringify(req.body))
//     .digest('hex');
//   if (hash === req.headers['x-paystack-signature']) {
//     next();
//   } else {
//     res.status(401).json({ error: 'Invalid Paystack signature' });
//   }
// };

// // Route to verify payment
// router.post('/verify/:reference', async (req, res) => {
//   const { reference } = req.params;
//   const { cart, total, address, email } = req.body;

//   try {
//     const response = await axios.get(`${PAYSTACK_API}/transaction/verify/${reference}`, {
//       headers: {
//         Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     const { data } = response.data;

//     if (data.status === 'success') {
//       // Payment verified, create order
//       const orderId = Math.floor(Math.random() * 1000000).toString();

//       const order = new Order({
//         email: email || data.customer.email, // Fallback to Paystack's customer email
//         address,
//         cart,
//         total,
//         paymentReference: reference,
//         orderId,
//         status: 'completed',
//       });

//       await order.save();

//       res.status(200).json({
//         message: 'Payment verified and order created',
//         order: {
//           orderId,
//           address,
//           cart,
//           total,
//           paymentReference: reference,
//         },
//       });
//     } else {
//       res.status(400).json({ error: 'Payment verification failed', details: data });
//     }
//   } catch (error) {
//     console.error('Error verifying payment:', error.message);
//     res.status(500).json({ error: 'Internal server error', details: error.message });
//   }
// });

// // Webhook endpoint for Paystack events
// router.post('/webhook', verifyPaystackSignature, async (req, res) => {
//   const event = req.body;

//   if (event.event === 'charge.success') {
//     const { reference } = event.data;
//     try {
//       const order = await Order.findOne({ paymentReference: reference });

//       if (order) {
//         order.status = 'completed';
//         await order.save();
//         console.log(`Order ${order.orderId} updated to completed`);
//       } else {
//         console.log(`No order found for reference: ${reference}`);
//       }

//       res.status(200).send('Webhook received');
//     } catch (error) {
//       console.error('Error processing webhook:', error.message);
//       res.status(500).json({ error: 'Webhook processing failed' });
//     }
//   } else {
//     res.status(200).send('Webhook received, no action taken');
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');

// Paystack API base URL
const PAYSTACK_API = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Middleware to verify Paystack webhook signature
const verifyPaystackSignature = (req, res, next) => {
  const crypto = require('crypto');
  const secret = PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (hash === req.headers['x-paystack-signature']) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid Paystack signature' });
  }
};

// Route to verify payment
router.post('/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  const { cart, total, address, email } = req.body;

  try {
    const response = await axios.get(`${PAYSTACK_API}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const { data } = response.data;

    if (data.status === 'success') {
      // Create order with Paystack reference as orderId
      const order = new Order({
        email: email || data.customer.email, // Use frontend email or Paystack's
        address,
        cart,
        total,
        orderId: reference, // Use Paystack reference
        status: 'completed',
      });

      await order.save();

      res.status(200).json({
        message: 'Payment verified and order created',
        order: {
          orderId: reference, // Return Paystack reference
          address,
          cart,
          total,
        },
      });
    } else {
      res.status(400).json({ error: 'Payment verification failed', details: data });
    }
  } catch (error) {
    console.error('Error verifying payment:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Webhook endpoint for Paystack events
router.post('/webhook', verifyPaystackSignature, async (req, res) => {
  const event = req.body;

  if (event.event === 'charge.success') {
    const { reference } = event.data;
    try {
      const order = await Order.findOne({ orderId: reference }); // Find by orderId
      if (order) {
        order.status = 'completed';
        await order.save();
        console.log(`Order ${order.orderId} updated to completed`);
      } else {
        console.log(`No order found for reference: ${reference}`);
      }
      res.status(200).send('Webhook received');
    } catch (error) {
      console.error('Error processing webhook:', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  } else {
    res.status(200).send('Webhook received, no action taken');
  }
});

module.exports = router;
