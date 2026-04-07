import bcrypt from 'bcryptjs';
import process from 'node:process';
import jwt from 'jsonwebtoken';
import Contact from '../model/Contact.js';
import Offer from '../model/Offer.js';
import Order from '../model/Order.js';
import Product from '../model/Product.js';
import Review from '../model/Review.js';
import User from '../model/User.js';
import { syncProductRatingFromReviewCollection } from '../utils/reviewHelpers.js';

const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@123';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change-admin-jwt-secret';
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '24h';
let currentAdminId = ADMIN_ID;
let currentAdminPassword = ADMIN_PASSWORD;
let currentAdminPasswordHash = ADMIN_PASSWORD_HASH;

const generateAdminToken = (adminId) => {
  return jwt.sign({ role: 'admin', adminId }, ADMIN_JWT_SECRET, {
    expiresIn: ADMIN_JWT_EXPIRES_IN,
  });
};

const decodeAdminToken = (token) => {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

    if (decoded?.role !== 'admin' || !decoded?.adminId) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

const isValidAdminToken = (token) => {
  const decoded = decodeAdminToken(token);
  if (!decoded || decoded.adminId !== currentAdminId) {
    return false;
  }

  return true;
};

const verifyAdminPassword = async (plainPassword = '') => {
  if (currentAdminPasswordHash) {
    return bcrypt.compare(String(plainPassword), currentAdminPasswordHash);
  }

  return String(plainPassword) === String(currentAdminPassword);
};

const validateProductPayload = (payload, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || payload.name !== undefined) {
    if (!payload.name || String(payload.name).trim().length < 3) {
      errors.push('Product name must be at least 3 characters long');
    }
  }

  if (!isUpdate || payload.category !== undefined) {
    if (!payload.category || String(payload.category).trim().length < 2) {
      errors.push('Product category is required');
    }
  }

  if (!isUpdate || payload.price !== undefined) {
    const numericPrice = Number(payload.price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      errors.push('Product price must be greater than 0');
    }
  }

  if (!isUpdate || payload.description !== undefined) {
    if (!payload.description || String(payload.description).trim().length < 10) {
      errors.push('Product description must be at least 10 characters long');
    }
  }

  if (payload.rating !== undefined) {
    const numericRating = Number(payload.rating);
    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
      errors.push('Product rating must be between 0 and 5');
    }
  }

  if (payload.quantity !== undefined) {
    const numericQuantity = Number(payload.quantity);
    if (Number.isNaN(numericQuantity) || numericQuantity < 0) {
      errors.push('Product quantity must be 0 or greater');
    }
  }

  return errors;
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return fallback;
};

const sanitizeUserPayload = async (body, isUpdate = false) => {
  const payload = {
    email: body.email?.toLowerCase().trim(),
    fullName: body.fullName?.trim(),
    mobile: body.mobile?.trim(),
    gender: body.gender?.toLowerCase(),
    address: body.address?.trim(),
    city: body.city?.trim(),
    state: body.state?.trim(),
    zipCode: body.zipCode?.trim(),
    profilePicture: body.profilePicture?.trim() || null,
  };

  if (body.password) {
    payload.password = await bcrypt.hash(body.password, 10);
  }

  if (isUpdate) {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  }

  return payload;
};

const sanitizeOfferPayload = (body, isUpdate = false) => {
  const payload = {
    title: body.title,
    description: body.description,
    discountPercentage: body.discountPercentage !== undefined ? Number(body.discountPercentage) : undefined,
    discountType: body.discountType,
    discountValue: body.discountValue !== undefined ? Number(body.discountValue) : undefined,
    applicableProducts: Array.isArray(body.applicableProducts) ? body.applicableProducts : undefined,
    startDate: body.startDate,
    endDate: body.endDate,
    isActive: body.isActive !== undefined ? parseBoolean(body.isActive, true) : undefined,
    image: body.image,
    code: body.code,
    minPurchaseAmount: body.minPurchaseAmount !== undefined ? Number(body.minPurchaseAmount) : undefined,
    bannerText: body.bannerText,
  };

  if (isUpdate) {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  }

  return payload;
};

const validateAdminProfileUpdatePayload = async (body) => {
  const errors = [];
  const nextAdminId = String(body.adminId || '').trim();
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');

  if (!nextAdminId && !newPassword) {
    errors.push('Provide adminId or newPassword to update profile');
  }

  if (!currentPassword) {
    errors.push('Current password is required');
  } else if (!(await verifyAdminPassword(currentPassword))) {
    errors.push('Current password is incorrect');
  }

  if (nextAdminId) {
    if (nextAdminId.length < 3 || nextAdminId.length > 30) {
      errors.push('Admin ID must be between 3 and 30 characters');
    }

    const adminIdPattern = /^[a-zA-Z0-9_.-]+$/;
    if (!adminIdPattern.test(nextAdminId)) {
      errors.push('Admin ID can contain letters, numbers, dot, underscore and hyphen only');
    }
  }

  if (newPassword) {
    if (newPassword.length < 8 || newPassword.length > 50) {
      errors.push('New password must be between 8 and 50 characters');
    }
  }

  return { errors, nextAdminId, newPassword };
};

export const adminLogin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({ message: 'Admin ID and password are required' });
    }

    const isAdminIdValid = adminId === currentAdminId;
    const isPasswordValid = await verifyAdminPassword(password);

    if (!isAdminIdValid || !isPasswordValid) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = generateAdminToken(adminId);

    return res.status(200).json({
      message: 'Admin login successful',
      data: {
        adminId,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Admin login failed', error: error.message });
  }
};

export const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token || !isValidAdminToken(token)) {
      return res.status(401).json({ message: 'Invalid or expired admin token' });
    }

    req.admin = decodeAdminToken(token);

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const loginTimestamp = req.admin?.iat ? req.admin.iat * 1000 : Date.now();
    const tokenExpiresAt = req.admin?.exp ? req.admin.exp * 1000 : loginTimestamp + 24 * 60 * 60 * 1000;

    return res.status(200).json({
      message: 'Admin profile fetched successfully',
      data: {
        adminId: req.admin?.adminId || currentAdminId,
        role: 'admin',
        loggedInAt: new Date(loginTimestamp).toISOString(),
        tokenExpiresAt: new Date(tokenExpiresAt).toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch admin profile', error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { errors, nextAdminId, newPassword } = await validateAdminProfileUpdatePayload(req.body || {});

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    if (nextAdminId) {
      currentAdminId = nextAdminId;
    }

    if (newPassword) {
      currentAdminPasswordHash = await bcrypt.hash(newPassword, 10);
      currentAdminPassword = newPassword;
    }

    return res.status(200).json({
      message: 'Admin profile updated successfully',
      data: {
        adminId: currentAdminId,
        role: 'admin',
        token: generateAdminToken(currentAdminId),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update admin profile', error: error.message });
  }
};

export const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Products fetched successfully',
      data: products,
      count: products.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

export const createAdminProduct = async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      category: req.body.category,
      price: Number(req.body.price),
      image: req.body.image || null,
      description: req.body.description,
      rating: req.body.rating !== undefined ? Number(req.body.rating) : 0,
      inStock: req.body.inStock !== undefined ? Boolean(req.body.inStock) : true,
      quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : 0,
    };

    const errors = validateProductPayload(payload);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const product = await Product.create(payload);

    return res.status(201).json({
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

export const updateAdminProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const payload = {
      name: req.body.name,
      category: req.body.category,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
      image: req.body.image,
      description: req.body.description,
      rating: req.body.rating !== undefined ? Number(req.body.rating) : undefined,
      inStock: req.body.inStock !== undefined ? Boolean(req.body.inStock) : undefined,
      quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
    };

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    const errors = validateProductPayload(sanitizedPayload, true);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, sanitizedPayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

export const deleteAdminProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Review.deleteMany({ productId: deletedProduct._id });

    return res.status(200).json({
      message: 'Product deleted successfully',
      data: deletedProduct,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    const lowStockThreshold = 5;
    const [
      productsCount,
      usersCount,
      ordersCount,
      offersCount,
      contactsCount,
      pendingReviewsCount,
      orderTotals,
      lowStockCount,
      outOfStockCount,
    ] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Offer.countDocuments(),
      Contact.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ]),
      Product.countDocuments({ quantity: { $gt: 0, $lte: lowStockThreshold } }),
      Product.countDocuments({ $or: [{ quantity: 0 }, { inStock: false }] }),
    ]);

    return res.status(200).json({
      message: 'Admin dashboard stats fetched successfully',
      data: {
        productsCount,
        usersCount,
        ordersCount,
        offersCount,
        contactsCount,
        pendingReviewsCount,
        totalRevenue: orderTotals[0]?.totalRevenue || 0,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      message: 'Users fetched successfully',
      data: users,
      count: users.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { email, fullName, mobile, password } = req.body;

    if (!email || !fullName || !mobile || !password) {
      return res.status(400).json({ message: 'email, fullName, mobile and password are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const payload = await sanitizeUserPayload(req.body);
    const user = await User.create(payload);

    return res.status(201).json({
      message: 'User created successfully',
      data: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const payload = await sanitizeUserPayload(req.body, true);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, payload, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId).select('-password');

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'fullName email mobile')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Orders fetched successfully',
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

export const createAdminOrder = async (req, res) => {
  try {
    const {
      userId,
      items,
      subtotalAmount,
      totalAmount,
      discountAmount,
      couponCode,
      couponTitle,
      shippingAddress,
      paymentMethod,
      status,
      paymentStatus,
      wantsCustomization,
      customizationNote,
      deliveryDate,
      deliverySlot,
    } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0 || totalAmount === undefined) {
      return res.status(400).json({ message: 'userId, items and totalAmount are required' });
    }

    const normalizedCustomization = parseBoolean(wantsCustomization);

    const order = await Order.create({
      userId,
      items,
      subtotalAmount: subtotalAmount !== undefined ? Number(subtotalAmount) : Number(totalAmount),
      discountAmount: discountAmount !== undefined ? Number(discountAmount) : 0,
      totalAmount: Number(totalAmount),
      couponCode: couponCode || '',
      couponTitle: couponTitle || '',
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || 'cod',
      status: status || 'pending',
      paymentStatus: paymentStatus || 'pending',
      wantsCustomization: normalizedCustomization,
      customizationNote: normalizedCustomization ? String(customizationNote || '').trim() : '',
      deliveryDate: deliveryDate || '',
      deliverySlot: deliverySlot || '',
    });

    return res.status(201).json({
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

export const updateAdminOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payload = {
      status: req.body.status,
      paymentStatus: req.body.paymentStatus,
      paymentMethod: req.body.paymentMethod,
      subtotalAmount: req.body.subtotalAmount !== undefined ? Number(req.body.subtotalAmount) : undefined,
      discountAmount: req.body.discountAmount !== undefined ? Number(req.body.discountAmount) : undefined,
      totalAmount: req.body.totalAmount !== undefined ? Number(req.body.totalAmount) : undefined,
      couponCode: req.body.couponCode,
      couponTitle: req.body.couponTitle,
      items: Array.isArray(req.body.items) ? req.body.items : undefined,
      shippingAddress: req.body.shippingAddress,
      wantsCustomization: req.body.wantsCustomization !== undefined ? parseBoolean(req.body.wantsCustomization) : undefined,
      customizationNote: req.body.customizationNote,
      deliveryDate: req.body.deliveryDate,
      deliverySlot: req.body.deliverySlot,
    };

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, sanitizedPayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
};

export const deleteAdminOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      message: 'Order deleted successfully',
      data: deletedOrder,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
};

export const getAdminOffers = async (req, res) => {
  try {
    const offers = await Offer.find().populate('applicableProducts', 'name').sort({ createdAt: -1 });
    return res.status(200).json({
      message: 'Offers fetched successfully',
      data: offers,
      count: offers.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch offers', error: error.message });
  }
};

export const createAdminOffer = async (req, res) => {
  try {
    const payload = sanitizeOfferPayload(req.body);

    if (!payload.title || !payload.description || !payload.startDate || !payload.endDate) {
      return res.status(400).json({ message: 'title, description, startDate and endDate are required' });
    }

    if (payload.discountPercentage === undefined || payload.discountValue === undefined) {
      return res.status(400).json({ message: 'discountPercentage and discountValue are required' });
    }

    const offer = await Offer.create(payload);

    return res.status(201).json({
      message: 'Offer created successfully',
      data: offer,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create offer', error: error.message });
  }
};

export const updateAdminOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const payload = sanitizeOfferPayload(req.body, true);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    const updatedOffer = await Offer.findByIdAndUpdate(offerId, payload, {
      new: true,
      runValidators: true,
    });

    if (!updatedOffer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    return res.status(200).json({
      message: 'Offer updated successfully',
      data: updatedOffer,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update offer', error: error.message });
  }
};

export const deleteAdminOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const deletedOffer = await Offer.findByIdAndDelete(offerId);

    if (!deletedOffer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    return res.status(200).json({
      message: 'Offer deleted successfully',
      data: deletedOffer,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete offer', error: error.message });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const statusFilter = String(req.query.status || 'pending').toLowerCase();
    const allowedStatuses = ['pending', 'approved', 'rejected', 'all'];

    if (!allowedStatuses.includes(statusFilter)) {
      return res.status(400).json({ message: 'Invalid status filter' });
    }

    const reviewQuery = statusFilter === 'all' ? {} : { status: statusFilter };

    const reviews = await Review.find(reviewQuery)
      .populate('productId', 'name image')
      .sort({ createdAt: -1 });

    const flattenedReviews = reviews.map((review) => ({
      _id: review._id,
      productId: review.productId?._id || null,
      productName: review.productId?.name || 'Unknown product',
      productImage: review.productId?.image || null,
      userId: review.userId,
      userName: review.userName,
      userEmail: review.userEmail || '',
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      isVerifiedBuyer: Boolean(review.isVerifiedBuyer),
      moderatedBy: review.moderatedBy,
      moderatedAt: review.moderatedAt,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    return res.status(200).json({
      message: 'Reviews fetched successfully',
      data: flattenedReviews,
      count: flattenedReviews.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

export const moderateAdminReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const nextStatus = String(req.body?.status || '').toLowerCase();

    if (!['approved', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = nextStatus;
    review.moderatedBy = req.admin?.adminId || ADMIN_ID;
    review.moderatedAt = new Date();
    await review.save();

    const product = await Product.findById(review.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found for this review' });
    }

    const stats = await syncProductRatingFromReviewCollection(product._id);
    product.rating = stats.averageRating;
    product.approvedReviewCount = stats.approvedReviewCount;
    product.reviewCount = stats.reviewCount;
    await product.save();

    return res.status(200).json({
      message: `Review ${nextStatus} successfully`,
      data: {
        reviewId,
        status: review.status,
        productId: product._id,
        productRating: product.rating,
        approvedReviewCount: product.approvedReviewCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to moderate review', error: error.message });
  }
};

export const getAdminContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ created_at: -1 });
    return res.status(200).json({
      message: 'Contacts fetched successfully',
      data: contacts,
      count: contacts.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch contacts', error: error.message });
  }
};

export const createAdminContact = async (req, res) => {
  try {
    const { name, email, mobile, subject, message, reply, status } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'name, email, subject and message are required' });
    }

    const contact = await Contact.create({
      name,
      email,
      mobile,
      subject,
      message,
      reply: reply || '',
      reply_date: reply ? Date.now() : null,
      status: status || 'Pending',
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return res.status(201).json({
      message: 'Contact created successfully',
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create contact', error: error.message });
  }
};

export const updateAdminContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const payload = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      subject: req.body.subject,
      message: req.body.message,
      reply: req.body.reply,
      status: req.body.status,
      reply_date: req.body.reply ? Date.now() : undefined,
      updated_at: Date.now(),
    };

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    const updatedContact = await Contact.findByIdAndUpdate(contactId, sanitizedPayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    return res.status(200).json({
      message: 'Contact updated successfully',
      data: updatedContact,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update contact', error: error.message });
  }
};

export const deleteAdminContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const deletedContact = await Contact.findByIdAndDelete(contactId);

    if (!deletedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    return res.status(200).json({
      message: 'Contact deleted successfully',
      data: deletedContact,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete contact', error: error.message });
  }
};
