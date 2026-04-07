import express from 'express';
import {
  createOffer,
  getActiveOffers,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  validateOfferCode,
} from '../controllers/Offer.controller.js';
import { adminAuthMiddleware } from '../controllers/Admin.controller.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveOffers);
router.get('/', getAllOffers);
router.get('/:id', getOfferById);
router.post('/validate-code', validateOfferCode);

// Admin routes
router.post('/', adminAuthMiddleware, createOffer);
router.put('/:id', adminAuthMiddleware, updateOffer);
router.delete('/:id', adminAuthMiddleware, deleteOffer);

export default router;
