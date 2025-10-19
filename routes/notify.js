// const express = require('express');
// const nodemailer = require('nodemailer');
// const router = express.Router();

// // Configure Nodemailer transporter (using Gmail)
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER, 
//     pass: process.env.EMAIL_PASS, 
//   },
// });

// // POST endpoint to notify seller of new order
// router.post('/notify-seller', async (req, res) => {
//   const { orderId, address, cart, total } = req.body;

//   // Validate request body
//   if (!orderId || !address || !cart || !total) {
//     return res.status(400).json({ error: 'Missing required order details' });
//   }

//   // Format email content
//   const itemsList = cart
//     .map((item, idx) => `${idx + 1}. ${item.name} (Qty: ${item.qty}, Price: ₦${item.price.toLocaleString()})${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}`)
//     .join('\n');

//   const emailContent = `
//     New Order #${orderId}
//     Customer: ${address.fullName}
//     Address: ${address.street}, ${address.city}, ${address.state}, ${address.postalCode}
//     Phone: ${address.phone}
//     Items:
//     ${itemsList}
//     Total: ₦${total.toLocaleString()}
//   `;

//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: process.env.SELLER_EMAIL || 'sntfrncsworldwide@gmail.com', 
//       subject: `New Order #${orderId}`,
//       text: emailContent,
//     });
//     res.json({ success: true, message: 'Seller notified successfully' });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ error: 'Failed to notify seller', details: error.message });
//   }
// });

// module.exports = router;

const express = require('express');
const nodemailer = require('nodemailer');
const Order = require('../models/Order');
const router = express.Router();

// Configure Nodemailer (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // app password
  },
});

// ✅ POST: Save order and notify seller
router.post('/notify-seller', async (req, res) => {
  const { orderId, email, address, cart, total } = req.body;

  if (!orderId || !email || !address || !cart || !total) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  // Format items for email
  const itemsList = cart
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (Qty: ${item.qty}, ₦${item.price.toLocaleString()})${
          item.selectedSize ? ` (Size: ${item.selectedSize})` : ''
        }`
    )
    .join('\n');

  // Email content
  const emailContent = `
New Order Received
===========================
Order ID: ${orderId}
Email: ${email}

Customer Info:
${address.fullName}
${address.street}, ${address.city}, ${address.state}, ${address.postalCode}
Phone: ${address.phone}

Items:
${itemsList}

Total: ₦${total.toLocaleString()}
Payment Reference: ${paymentReference || 'N/A'}

Thank you.
  `;

  try {
    // Save order to database
    const newOrder = new Order({
      orderId,
      email,
      address,
      cart,
      total,
      paymentReference,
    });
    await newOrder.save();

    // Send email notification to seller
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.SELLER_EMAIL || 'sntfrncsworldwide@gmail.com',
      subject: `🛍️ New Order #${orderId}`,
      text: emailContent,
    });

    res.json({ success: true, message: 'Order saved & seller notified' });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order', details: error.message });
  }
});

// ✅ GET: Fetch all orders for admin page
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;


