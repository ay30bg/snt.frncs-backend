// backend/models/Cart.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true }, // Product ID
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  image: { type: String },
  selectedSize: { type: String },
});

module.exports = mongoose.model('Cart', cartSchema);
