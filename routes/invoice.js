const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { jsPDF } = require('jspdf');

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/invoice/send
router.post('/send', async (req, res) => {
  const { seller_email, order_id, customer_name, total, shipping_address, phone, items, cart } = req.body;

  // Validate request body
  if (!order_id || !customer_name || !total || !shipping_address || !phone || !items || !cart) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  // Generate PDF
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Snt.Frncs Store', 60, 20);
  doc.setFontSize(18);
  doc.text('Order Receipt', 14, 40);
  doc.setFontSize(12);
  doc.text(`Order ID: #${order_id}`, 14, 55);
  doc.text('Shipping To:', 14, 80);
  doc.text(customer_name, 14, 90);
  doc.text(shipping_address, 14, 100);
  doc.text(phone, 14, 110);
  doc.text('Items Ordered:', 14, 130);
  cart.forEach((item, idx) => {
    doc.text(
      `${idx + 1}. ${item.name} (${item.qty} × ₦${Number(item.price).toLocaleString()})`,
      14,
      140 + idx * 10
    );
  });
  doc.text(`Total: ₦${Number(total).toLocaleString()}`, 14, 160 + cart.length * 10);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  // Email options
  const mailOptions = {
    from: `"Snt.Frncs Store" <${process.env.EMAIL_USER}>`,
    to: seller_email || process.env.SELLER_EMAIL || 'sntfrncsworldwide@gmail.com
',
    subject: `Invoice for Order #${order_id}`,
    text: `Dear Seller,\n\nAttached is the invoice for Order #${order_id}.\n\nCustomer: ${customer_name}\nShipping Address: ${shipping_address}\nPhone: ${phone}\nTotal: ₦${Number(total).toLocaleString()}\n\nItems Ordered:\n${items}\n\nBest regards,\nSnt.Francis Store`,
    html: `
      <h2>Invoice for Order #${order_id}</h2>
      <p><strong>Customer:</strong> ${customer_name}</p>
      <p><strong>Shipping Address:</strong> ${shipping_address}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Total:</strong> ₦${Number(total).toLocaleString()}</p>
      <p><strong>Items Ordered:</strong></p>
      <pre>${items}</pre>
      <p>Please find the attached PDF receipt.</p>
      <p>Best regards,<br>Snt.Frncs Store</p>
    `,
    attachments: [
      {
        filename: `receipt-${order_id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ error: 'Failed to send invoice', details: error.message });
  }
});

module.exports = router;
