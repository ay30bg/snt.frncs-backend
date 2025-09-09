const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Initialize Paystack transaction
router.post('/initialize', async (req, res) => {
  console.log('Initialize request body:', req.body); // Log request body for debugging
  try {
    const { email, amount, metadata } = req.body;

    if (!email || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid email and amount (greater than 0) are required' });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, access_code, reference } = response.data.data;
    res.json({ authorization_url, access_code, reference });
  } catch (error) {
    console.error('Error initializing transaction:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initialize transaction' });
  }
});

// Verify Paystack transaction
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

    const { status, data } = response.data;
    if (status && data.status === 'success') {
      res.json({
        status: 'success',
        data: {
          reference: data.reference,
          amount: data.amount / 100, // Convert back to Naira
          email: data.customer.email,
          metadata: data.metadata,
        },
      });
    } else {
      res.status(400).json({ error: 'Payment verification failed', details: data });
    }
  } catch (error) {
    console.error('Error verifying transaction:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});

// Webhook for Paystack events
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const { reference, amount, customer, metadata } = data;
      console.log(`Payment successful: Reference=${reference}, Amount=${amount / 100}, Email=${customer.email}`);
      // Save to database (e.g., MongoDB)
      // Example: await Order.create({ reference, amount: amount / 100, email: customer.email, metadata });
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
