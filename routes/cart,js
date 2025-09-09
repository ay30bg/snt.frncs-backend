// backend/routes/cart.js
const express = require('express');
const Cart = require('../models/Cart');

const router = express.Router();

// Get cart for a user
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.find({ userId: req.params.userId });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error });
  }
});

// Add or update item in cart
router.post('/', async (req, res) => {
  try {
    const { userId, id, name, price, qty, image, selectedSize } = req.body;
    let cartItem = await Cart.findOne({ userId, id });
    if (cartItem) {
      cartItem.qty += qty || 1;
      await cartItem.save();
    } else {
      cartItem = new Cart({ userId, id, name, price, qty: qty || 1, image, selectedSize });
      await cartItem.save();
    }
    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error });
  }
});

// Update quantity
router.put('/:id', async (req, res) => {
  try {
    const { qty } = req.body;
    const cartItem = await Cart.findById(req.params.id);
    if (cartItem) {
      cartItem.qty = qty;
      await cartItem.save();
      res.json(cartItem);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating quantity', error });
  }
});

// Remove item
router.delete('/:id', async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item', error });
  }
});

// Clear cart
router.delete('/user/:userId', async (req, res) => {
  try {
    await Cart.deleteMany({ userId: req.params.userId });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error });
  }
});

module.exports = router;
