import express from 'express';
import {
  adminLogin,
  adminAuthMiddleware,
  getAdminProfile,
  updateAdminProfile,
  getAdminDashboardStats,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminOrders,
  createAdminOrder,
  updateAdminOrder,
  deleteAdminOrder,
  getAdminOffers,
  createAdminOffer,
  updateAdminOffer,
  deleteAdminOffer,
  getAdminReviews,
  moderateAdminReview,
  getAdminContacts,
  createAdminContact,
  updateAdminContact,
  deleteAdminContact,
} from '../controllers/Admin.controller.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/profile', adminAuthMiddleware, getAdminProfile);
router.put('/profile', adminAuthMiddleware, updateAdminProfile);

router.get('/dashboard/stats', adminAuthMiddleware, getAdminDashboardStats);

router.get('/products', adminAuthMiddleware, getAdminProducts);
router.post('/products', adminAuthMiddleware, createAdminProduct);
router.put('/products/:productId', adminAuthMiddleware, updateAdminProduct);
router.delete('/products/:productId', adminAuthMiddleware, deleteAdminProduct);

router.get('/users', adminAuthMiddleware, getAdminUsers);
router.post('/users', adminAuthMiddleware, createAdminUser);
router.put('/users/:userId', adminAuthMiddleware, updateAdminUser);
router.delete('/users/:userId', adminAuthMiddleware, deleteAdminUser);

router.get('/orders', adminAuthMiddleware, getAdminOrders);
router.post('/orders', adminAuthMiddleware, createAdminOrder);
router.put('/orders/:orderId', adminAuthMiddleware, updateAdminOrder);
router.delete('/orders/:orderId', adminAuthMiddleware, deleteAdminOrder);

router.get('/offers', adminAuthMiddleware, getAdminOffers);
router.post('/offers', adminAuthMiddleware, createAdminOffer);
router.put('/offers/:offerId', adminAuthMiddleware, updateAdminOffer);
router.delete('/offers/:offerId', adminAuthMiddleware, deleteAdminOffer);

router.get('/reviews', adminAuthMiddleware, getAdminReviews);
router.patch('/reviews/:reviewId/moderate', adminAuthMiddleware, moderateAdminReview);

router.get('/contacts', adminAuthMiddleware, getAdminContacts);
router.post('/contacts', adminAuthMiddleware, createAdminContact);
router.put('/contacts/:contactId', adminAuthMiddleware, updateAdminContact);
router.delete('/contacts/:contactId', adminAuthMiddleware, deleteAdminContact);

export default router;
