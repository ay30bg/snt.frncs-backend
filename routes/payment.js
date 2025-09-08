// routes/payment.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const Order = require('../models/Order'); // Import the Order model

// Paystack secret key from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Middleware to verify Paystack signature for webhooks
const verifyPaystackSignature = (req, res, next) => {
  const crypto = require('crypto');
  const secret = PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ error: 'Invalid Paystack signature' });
  }
  next();
};

// Initialize Payment
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, cart, address, userId } = req.body;

    if (!email || !amount || !cart || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create an order in MongoDB
    const order = new Order({
      userId: userId || null, // Store userId if authenticated
      address,
      cart,
      total: amount,
      paymentStatus: 'pending',
    });
    await order.save();

    // Initialize payment with Paystack
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        reference: `order_${order._id}_${Date.now()}`,
        metadata: {
          orderId: order._id,
          fullName: address.fullName,
          phone: address.phone,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Verify Payment
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentData = response.data.data;
    if (paymentData.status === 'success') {
      // Update order status in MongoDB
      await Order.findOneAndUpdate(
        { paymentReference: reference },
        { paymentStatus: 'completed', paymentReference: reference }
      );
      res.json({ status: 'success', data: paymentData });
    } else {
      res.status(400).json({ status: 'failed', message: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Paystack Webhook
router.post('/webhook', verifyPaystackSignature, async (req, res) => {
  try {
    const event = req.body;
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const order = await Order.findOneAndUpdate(
        { _id: metadata.orderId, paymentReference: reference },
        { paymentStatus: 'completed' },
        { new: true }
      );

      if (!order) {
        console.error('Order not found for webhook:', reference);
        return res.status(404).json({ error: 'Order not found' });
      }
    }
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
