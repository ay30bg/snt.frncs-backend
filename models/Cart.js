const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  cart: [
    {
      cartId: { type: String, required: true },
      id: { type: String, required: true },
      name: String,
      price: Number,
      image: String,
      selectedSize: String,
      qty: { type: Number, default: 1 },
    },
  ],
});

module.exports = mongoose.model('Cart', cartSchema);
