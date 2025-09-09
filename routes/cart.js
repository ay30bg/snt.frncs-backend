const express = require('express');
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const router = express.Router();

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Get cart
router.get('/', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    res.json(cart ? cart.cart : []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to cart
router.post('/', authenticate, async (req, res) => {
  try {
    const item = req.body;
    const cartId = `${item.id}-${item.selectedSize || 'default'}`; // Unique cartId
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, cart: [{ ...item, cartId, qty: 1 }] });
    } else {
      const exist = cart.cart.find((p) => p.cartId === cartId);
      if (exist) {
        cart.cart = cart.cart.map((p) =>
          p.cartId === cartId ? { ...p, qty: p.qty + 1 } : p
        );
      } else {
        cart.cart.push({ ...item, cartId, qty: 1 });
      }
    }
    await cart.save();
    res.json(cart.cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update quantity
router.put('/', authenticate, async (req, res) => {
  try {
    const { cartId, qty } = req.body;
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.cart = cart.cart.map((p) => (p.cartId === cartId ? { ...p, qty } : p));
    await cart.save();
    res.json(cart.cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove item
router.delete('/:cartId', authenticate, async (req, res) => {
  try {
    const { cartId } = req.params;
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.cart = cart.cart.filter((p) => p.cartId !== cartId);
    await cart.save();
    res.json(cart.cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear cart
router.delete('/', authenticate, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.userId }, { cart: [] });
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
