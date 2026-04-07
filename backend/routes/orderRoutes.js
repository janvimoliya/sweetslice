import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrdersByUserId,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
} from '../controllers/Order.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Order operations
router.post('/create', createOrder);
router.get('/all', getAllOrders);
router.get('/user/:userId', getOrdersByUserId);
router.get('/:orderId', getOrderById);
router.put('/:orderId/status', updateOrderStatus);
router.put('/:orderId/cancel', authMiddleware, cancelOrder);
router.delete('/:orderId', deleteOrder);

export default router;
