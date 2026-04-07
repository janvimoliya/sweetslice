import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductReviews,
  submitProductReview,
} from '../controllers/Product.controller.js';

const router = express.Router();

// Product CRUD operations
router.post('/create', createProduct);
router.get('/all', getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', submitProductReview);
router.get('/:productId', getProductById);
router.put('/:productId', updateProduct);
router.delete('/:productId', deleteProduct);

export default router;
