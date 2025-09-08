// // // routes/payment.js
// // const express = require('express');
// // const axios = require('axios');
// // const crypto = require('crypto');
// // const Order = require('../models/Order');
// // const router = express.Router();

// // // Initialize Transaction
// // router.post('/initialize', async (req, res) => {
// //   const { email, amount, cart, address, userId } = req.body;

// //   try {
// //     const response = await axios.post(
// //       'https://api.paystack.co/transaction/initialize',
// //       {
// //         email,
// //         amount: amount * 100, // Convert to kobo
// //         currency: 'NGN',
// //         metadata: {
// //           fullName: address.fullName,
// //           phone: address.phone,
// //           cart,
// //           userId,
// //         },
// //       },
// //       {
// //         headers: {
// //           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
// //           'Content-Type': 'application/json',
// //         },
// //       }
// //     );

// //     const { authorization_url, access_code, reference } = response.data.data;

// //     // Save order to database with pending status
// //     const order = new Order({
// //       userId,
// //       cart,
// //       total: amount,
// //       address,
// //       paymentReference: reference,
// //     });
// //     await order.save();

// //     res.json({ authorization_url, access_code, reference });
// //   } catch (error) {
// //     console.error('Initialization error:', error.response?.data || error.message);
// //     res.status(500).json({ error: 'Failed to initialize transaction' });
// //   }
// // });

// // // Verify Transaction
// // router.get('/verify/:reference', async (req, res) => {
// //   const { reference } = req.params;

// //   try {
// //     const response = await axios.get(
// //       `https://api.paystack.co/transaction/verify/${reference}`,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
// //         },
// //       }
// //     );

// //     const { status, data } = response.data;
// //     if (status && data.status === 'success') {
// //       // Update order status to 'completed'
// //       await Order.findOneAndUpdate(
// //         { paymentReference: reference },
// //         { status: 'completed' },
// //         { new: true }
// //       );
// //       res.json({ status: 'success', data });
// //     } else {
// //       res.status(400).json({ status: 'failed', message: 'Payment not successful' });
// //     }
// //   } catch (error) {
// //     console.error('Verification error:', error.response?.data || error.message);
// //     res.status(500).json({ error: 'Failed to verify transaction' });
// //   }
// // });

// // // Webhook Handler
// // router.post('/webhook', async (req, res) => {
// //   // Verify webhook signature
// //   const hash = crypto
// //     .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
// //     .update(JSON.stringify(req.body))
// //     .digest('hex');

// //   if (hash !== req.headers['x-paystack-signature']) {
// //     return res.status(401).json({ error: 'Invalid signature' });
// //   }

// //   const event = req.body;
// //   if (event.event === 'charge.success') {
// //     const { reference } = event.data;
// //     try {
// //       // Update order status to 'completed'
// //       const order = await Order.findOneAndUpdate(
// //         { paymentReference: reference },
// //         { status: 'completed' },
// //         { new: true }
// //       );

// //       if (!order) {
// //         return res.status(404).json({ error: 'Order not found' });
// //       }

// //       res.status(200).json({ status: 'success' });
// //     } catch (error) {
// //       console.error('Webhook error:', error.message);
// //       res.status(500).json({ error: 'Webhook processing failed' });
// //     }
// //   } else {
// //     res.status(200).json({ status: 'ignored' });
// //   }
// // });

// // module.exports = router;

// const express = require('express');
// const axios = require('axios');
// const crypto = require('crypto');
// const Order = require('../models/Order');
// const router = express.Router();

// // Initialize Transaction
// router.post('/initialize', async (req, res) => {
//   const { email, amount, cart, address, userId } = req.body;

//   // Log incoming payload for debugging
//   console.log('Received payload:', req.body);

//   // Validate required fields
//   if (!email || typeof email !== 'string' || !email.includes('@')) {
//     return res.status(400).json({
//       status: false,
//       message: 'A valid email address is required',
//       meta: { nextStep: 'Provide all required params' },
//       type: 'validation_error',
//       code: 'missing_params',
//     });
//   }
//   if (!amount || isNaN(amount) || amount <= 0) {
//     return res.status(400).json({
//       status: false,
//       message: 'A valid amount is required',
//       meta: { nextStep: 'Provide all required params' },
//       type: 'validation_error',
//       code: 'missing_params',
//     });
//   }
//   if (!cart || !Array.isArray(cart) || cart.length === 0) {
//     return res.status(400).json({
//       status: false,
//       message: 'A valid cart is required',
//       meta: { nextStep: 'Provide all required params' },
//       type: 'validation_error',
//       code: 'missing_params',
//     });
//   }
//   if (!address || !address.fullName || !address.phone || !address.street || !address.city || !address.state || !address.postalCode) {
//     return res.status(400).json({
//       status: false,
//       message: 'A complete address is required',
//       meta: { nextStep: 'Provide all required params' },
//       type: 'validation_error',
//       code: 'missing_params',
//     });
//   }
//   if (!userId) {
//     return res.status(400).json({
//       status: false,
//       message: 'User ID is required',
//       meta: { nextStep: 'Provide all required params' },
//       type: 'validation_error',
//       code: 'missing_params',
//     });
//   }

//   try {
//     const response = await axios.post(
//       'https://api.paystack.co/transaction/initialize',
//       {
//         email,
//         amount: amount * 100, // Convert to kobo
//         currency: 'NGN',
//         metadata: {
//           fullName: address.fullName,
//           phone: address.phone,
//           cart,
//           userId,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const { authorization_url, access_code, reference } = response.data.data;

//     // Save order to database with pending status
//     const order = new Order({
//       userId,
//       cart,
//       total: amount,
//       address,
//       paymentReference: reference,
//     });
//     await order.save();

//     res.json({ authorization_url, access_code, reference });
//   } catch (error) {
//     console.error('Initialization error:', error.response?.data || error.message);
//     res.status(500).json({
//       status: false,
//       message: error.response?.data?.message || 'Failed to initialize transaction',
//       type: 'server_error',
//       code: error.response?.data?.code || 'server_error',
//     });
//   }
// });

// // Verify Transaction
// router.get('/verify/:reference', async (req, res) => {
//   const { reference } = req.params;

//   try {
//     const response = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         },
//       }
//     );

//     const { status, data } = response.data;
//     if (status && data.status === 'success') {
//       // Update order status to 'completed'
//       const order = await Order.findOneAndUpdate(
//         { paymentReference: reference },
//         { status: 'completed' },
//         { new: true }
//       );
//       if (!order) {
//         return res.status(404).json({ status: 'failed', message: 'Order not found' });
//       }
//       res.json({ status: 'success', data });
//     } else {
//       res.status(400).json({ status: 'failed', message: 'Payment not successful' });
//     }
//   } catch (error) {
//     console.error('Verification error:', error.response?.data || error.message);
//     res.status(500).json({
//       status: false,
//       message: error.response?.data?.message || 'Failed to verify transaction',
//       type: 'server_error',
//       code: error.response?.data?.code || 'server_error',
//     });
//   }
// });

// // Webhook Handler
// router.post('/webhook', async (req, res) => {
//   // Verify webhook signature
//   const hash = crypto
//     .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
//     .update(JSON.stringify(req.body))
//     .digest('hex');

//   if (hash !== req.headers['x-paystack-signature']) {
//     return res.status(401).json({ status: false, message: 'Invalid signature' });
//   }

//   const event = req.body;
//   if (event.event === 'charge.success') {
//     const { reference } = event.data;
//     try {
//       // Update order status to 'completed'
//       const order = await Order.findOneAndUpdate(
//         { paymentReference: reference },
//         { status: 'completed' },
//         { new: true }
//       );

//       if (!order) {
//         return res.status(404).json({ status: false, message: 'Order not found' });
//       }

//       res.status(200).json({ status: 'success' });
//     } catch (error) {
//       console.error('Webhook error:', error.message);
//       res.status(500).json({
//         status: false,
//         message: 'Webhook processing failed',
//         type: 'server_error',
//         code: 'server_error',
//       });
//     }
//   } else {
//     res.status(200).json({ status: 'ignored' });
//   }
// });

// module.exports = router;

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');
const router = express.Router();

// Initialize Transaction
router.post('/initialize', async (req, res) => {
  const { email, amount, cart, address, userId } = req.body;

  // Log incoming payload for debugging
  console.log('Received payload:', req.body);

  // Validate required fields
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    return res.status(400).json({
      status: false,
      message: 'A valid email address is required',
      meta: { nextStep: 'Provide a valid email address' },
      type: 'validation_error',
      code: 'missing_params',
    });
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      status: false,
      message: 'A valid amount is required',
      meta: { nextStep: 'Provide a valid amount' },
      type: 'validation_error',
      code: 'missing_params',
    });
  }
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({
      status: false,
      message: 'A valid cart is required',
      meta: { nextStep: 'Provide a valid cart' },
      type: 'validation_error',
      code: 'missing_params',
    });
  }
  if (
    !address ||
    !address.fullName ||
    !address.phone ||
    !address.street ||
    !address.city ||
    !address.state ||
    !address.postalCode
  ) {
    return res.status(400).json({
      status: false,
      message: 'A complete address is required',
      meta: { nextStep: 'Provide all address fields' },
      type: 'validation_error',
      code: 'missing_params',
    });
  }
  if (!userId) {
    return res.status(400).json({
      status: false,
      message: 'User ID is required',
      meta: { nextStep: 'Provide a user ID' },
      type: 'validation_error',
      code: 'missing_params',
    });
  }

  // Validate Paystack secret key
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('PAYSTACK_SECRET_KEY is not set');
    return res.status(500).json({
      status: false,
      message: 'Server configuration error',
      type: 'server_error',
      code: 'missing_env_variable',
    });
  }

  try {
    // Make Paystack API request
    console.log('Sending request to Paystack:', { email, amount: amount * 100, currency: 'NGN' });
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        metadata: {
          fullName: address.fullName,
          phone: address.phone,
          cart,
          userId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, access_code, reference } = response.data.data;
    console.log('Paystack response:', { authorization_url, access_code, reference });

    // Save order to database
    try {
      const order = new Order({
        userId,
        cart,
        total: amount,
        address,
        paymentReference: reference,
      });
      await order.save();
      console.log('Order saved:', order);
    } catch (dbError) {
      console.error('Database save error:', dbError.message);
      return res.status(500).json({
        status: false,
        message: 'Failed to save order to database',
        type: 'server_error',
        code: 'database_error',
      });
    }

    res.json({ authorization_url, access_code, reference });
  } catch (error) {
    console.error('Initialization error:', error.response?.data || error.message);
    // Pass through Paystack's error status if available
    const status = error.response?.status || 500;
    res.status(status).json({
      status: false,
      message: error.response?.data?.message || 'Failed to initialize transaction',
      type: error.response?.data?.type || 'server_error',
      code: error.response?.data?.code || 'server_error',
    });
  }
});

// Verify Transaction
router.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;

  // Validate Paystack secret key
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('PAYSTACK_SECRET_KEY is not set');
    return res.status(500).json({
      status: false,
      message: 'Server configuration error',
      type: 'server_error',
      code: 'missing_env_variable',
    });
  }

  try {
    console.log('Verifying Paystack transaction:', reference);
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status, data } = response.data;
    console.log('Paystack verify response:', response.data);
    if (status && data.status === 'success') {
      // Update order status to 'completed'
      const order = await Order.findOneAndUpdate(
        { paymentReference: reference },
        { status: 'completed' },
        { new: true }
      );
      if (!order) {
        console.error('Order not found for reference:', reference);
        return res.status(404).json({ status: 'failed', message: 'Order not found' });
      }
      res.json({ status: 'success', data });
    } else {
      res.status(400).json({ status: 'failed', message: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({
      status: false,
      message: error.response?.data?.message || 'Failed to verify transaction',
      type: error.response?.data?.type || 'server_error',
      code: error.response?.data?.code || 'server_error',
    });
  }
});

// Webhook Handler
router.post('/webhook', async (req, res) => {
  // Validate Paystack secret key
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('PAYSTACK_SECRET_KEY is not set');
    return res.status(500).json({
      status: false,
      message: 'Server configuration error',
      type: 'server_error',
      code: 'missing_env_variable',
    });
  }

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ status: false, message: 'Invalid signature' });
  }

  const event = req.body;
  if (event.event === 'charge.success') {
    const { reference } = event.data;
    try {
      console.log('Processing webhook for reference:', reference);
      // Update order status to 'completed'
      const order = await Order.findOneAndUpdate(
        { paymentReference: reference },
        { status: 'completed' },
        { new: true }
      );

      if (!order) {
        console.error('Order not found for webhook reference:', reference);
        return res.status(404).json({ status: 'failed', message: 'Order not found' });
      }

      console.log('Webhook order updated:', order);
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Webhook error:', error.message);
      res.status(500).json({
        status: false,
        message: 'Webhook processing failed',
        type: 'server_error',
        code: 'server_error',
      });
    }
  } else {
    console.log('Webhook event ignored:', event.event);
    res.status(200).json({ status: 'ignored' });
  }
});

module.exports = router;
