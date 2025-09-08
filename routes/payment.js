const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const Payment = require('../models/Payment');

// Middleware to verify JWT (adapted from auth.js)
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Initialize Transaction
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { email, amount, fullName, phone } = req.body;

    // Validate request
    if (!email || !amount || !fullName || !phone) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Convert amount to kobo
    const amountInKobo = amount * 100;

    // Initialize Paystack transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountInKobo,
        currency: 'NGN',
        metadata: { fullName, phone },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Save transaction
    const payment = new Payment({
      userId: req.user.userId,
      fullName,
      email,
      phone,
      amount,
      reference: response.data.data.reference,
    });
    await payment.save();

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Initialization error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error during transaction initialization', error: error.message });
  }
});

// Verify Transaction
router.get('/verify/:reference', authMiddleware, async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify transaction with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { status, amount, metadata } = response.data.data;

    // Update payment status
    const payment = await Payment.findOne({ reference });
    if (payment) {
      payment.status = status === 'success' ? 'success' : 'failed';
      payment.updatedAt = Date.now();
      await payment.save();
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error during transaction verification', error: error.message });
  }
});

// Webhook for Paystack Events
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { reference, amount, status } = event.data;
      const payment = await Payment.findOne({ reference });
      if (payment) {
        payment.status = status;
        payment.updatedAt = Date.now();
        await payment.save();
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ message: 'Server error processing webhook', error: error.message });
  }
});

module.exports = router;
