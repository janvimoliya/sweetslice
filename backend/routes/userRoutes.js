import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/User.controller.js';
import { uploadProfilePic } from '../config/multer.js';

const router = express.Router();

// Public routes
router.post('/register', uploadProfilePic.single('profile_picture'), registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes (add auth middleware if needed)
router.get('/all', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', uploadProfilePic.single('profile_picture'), updateUser);
router.delete('/:id', deleteUser);

export default router;
