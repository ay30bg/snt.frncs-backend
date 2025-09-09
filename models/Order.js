const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true }, // Store email from Paystack metadata or frontend
  address: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
  },
  cart: [
    {
      name: String,
      qty: Number,
      price: Number,
      image: String,
      selectedSize: String,
    },
  ],
  total: Number,
  paymentReference: String,
   orderId: { type: String, required: true, unique: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
