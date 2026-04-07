import express from 'express';
import {
  createOrder,
  initiateOrderPayment,
  verifyOrderPayment,
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
router.post('/:orderId/payment/initiate', initiateOrderPayment);
router.post('/:orderId/payment/verify', verifyOrderPayment);
router.get('/all', getAllOrders);
router.get('/user/:userId', getOrdersByUserId);
router.get('/:orderId', getOrderById);
router.put('/:orderId/status', updateOrderStatus);
router.put('/:orderId/cancel', authMiddleware, cancelOrder);
router.delete('/:orderId', deleteOrder);

export default router;
