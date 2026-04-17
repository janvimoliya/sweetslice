import Product from '../model/Product.js';
import Order from '../model/Order.js';
import Review from '../model/Review.js';
import User from '../model/User.js';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import jwt from 'jsonwebtoken';
import { syncProductRatingFromReviewCollection } from '../utils/reviewHelpers.js';

const getTokenFromHeader = (authorizationHeader = '') => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice(7).trim() || null;
};

const resolveUserIdFromToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded?.userId) {
      return String(decoded.userId);
    }
  } catch {
    // Fall back to legacy token format
  }

  try {
    const decodedLegacy = Buffer.from(token, 'base64').toString('utf8');
    const [userId] = decodedLegacy.split(':');
    return userId || null;
  } catch {
    return null;
  }
};

const hasDeliveredPurchaseForProduct = async ({ userId, productObjectId }) => {
  if (!userId || !productObjectId) {
    return false;
  }

  return Boolean(
    await Order.exists({
      userId,
      status: 'delivered',
      $or: [
        { 'items.productId': productObjectId },
        { 'items.productId': String(productObjectId) },
      ],
    })
  );
};

// Create Product
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, image, description, rating, inStock, quantity } = req.body;

    const newProduct = new Product({
      name,
      category,
      price,
      image,
      description,
      rating,
      inStock,
      quantity,
    });

    await newProduct.save();

    res.status(201).json({
      message: 'Product created successfully',
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Get All Products
export const getAllProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;

    let filter = {};

    if (category && category !== 'All Products') {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    let products = await Product.find(filter);

    // Sort products
    if (sort === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    } else {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.status(200).json({
      message: 'Products fetched successfully',
      data: products,
      count: products.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get Product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product fetched', data: product });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, category, price, image, description, rating, inStock, quantity } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { name, category, price, image, description, rating, inStock, quantity },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Review.deleteMany({ productId: deletedProduct._id });

    res.status(200).json({
      message: 'Product deleted successfully',
      data: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Get Products by Category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const products = await Product.find({ category });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found in this category' });
    }

    res.status(200).json({
      message: 'Products fetched by category',
      data: products,
      count: products.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get approved product reviews
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).select('name rating reviewCount approvedReviewCount');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const approvedReviews = await Review.find({
      productId,
      status: 'approved',
    })
      .sort({ createdAt: -1 })
      .select('userName rating comment isVerifiedBuyer createdAt');

    return res.status(200).json({
      message: 'Product reviews fetched successfully',
      data: {
        productId,
        productName: product.name,
        averageRating: product.rating,
        reviewCount: product.reviewCount,
        approvedReviewCount: product.approvedReviewCount,
        reviews: approvedReviews,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching product reviews', error: error.message });
  }
};

// Add or update a verified-buyer review (goes to moderation queue)
export const submitProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.length < 5) {
      return res.status(400).json({ message: 'Comment must be at least 5 characters long' });
    }

    const token = getTokenFromHeader(req.headers.authorization || '');
    const userId = resolveUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ message: 'Please log in to submit a review' });
    }

    const [product, user] = await Promise.all([
      Product.findById(productId),
      User.findById(userId).select('fullName email'),
    ]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found for this session' });
    }

    const hasDeliveredOrder = await hasDeliveredPurchaseForProduct({
      userId,
      productObjectId: product._id,
    });

    if (!hasDeliveredOrder) {
      return res.status(403).json({
        message: 'Only users who purchased and received this product can submit a review',
      });
    }

    await Review.findOneAndUpdate(
      { productId: product._id, userId },
      {
        productId: product._id,
        userId,
        userName: user.fullName || 'Customer',
        userEmail: String(user.email || '').trim().toLowerCase(),
        rating,
        comment,
        isVerifiedBuyer: true,
        status: 'pending',
        moderatedBy: null,
        moderatedAt: null,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const stats = await syncProductRatingFromReviewCollection(product._id);
    product.rating = stats.averageRating;
    product.approvedReviewCount = stats.approvedReviewCount;
    product.reviewCount = stats.reviewCount;
    await product.save();

    return res.status(201).json({
      message: 'Review submitted successfully and is pending moderation',
      data: {
        productId,
        rating,
        comment,
        isVerifiedBuyer: true,
        status: 'pending',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error submitting product review', error: error.message });
  }
};

// Check if current user can review a product (must have delivered purchase)
export const getProductReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const token = getTokenFromHeader(req.headers.authorization || '');
    const userId = resolveUserIdFromToken(token);

    if (!userId) {
      return res.status(200).json({
        message: 'Review eligibility fetched',
        data: {
          canReview: false,
          reason: 'login-required',
        },
      });
    }

    const product = await Product.findById(productId).select('_id');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const canReview = await hasDeliveredPurchaseForProduct({
      userId,
      productObjectId: product._id,
    });

    return res.status(200).json({
      message: 'Review eligibility fetched',
      data: {
        canReview,
        reason: canReview ? 'eligible' : 'not-purchased-or-not-delivered',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error checking review eligibility', error: error.message });
  }
};
