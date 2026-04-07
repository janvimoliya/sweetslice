import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkItemInWishlist,
} from '../controllers/Wishlist.controller.js';

const router = express.Router();

// Wishlist operations
router.get('/:userId', getWishlist);
router.post('/add', addToWishlist);
router.delete('/:userId/remove', removeFromWishlist);
router.delete('/:userId/clear', clearWishlist);
router.get('/:userId/check', checkItemInWishlist);

export default router;
