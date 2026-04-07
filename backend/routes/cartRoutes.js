import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/Cart.controller.js';

const router = express.Router();

// Cart operations
router.get('/:userId', getCart);
router.post('/add', addToCart);
router.put('/:userId/update', updateCartItem);
router.delete('/:userId/remove', removeFromCart);
router.delete('/:userId/clear', clearCart);

export default router;
