import Wishlist from '../model/Wishlist.js';
import Product from '../model/Product.js';

// Get Wishlist by User ID
export const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    let wishlist = await Wishlist.findOne({ userId }).populate('items.productId');

    if (!wishlist) {
      return res.status(404).json({
        message: 'Wishlist not found',
        data: { items: [] },
      });
    }

    res.status(200).json({
      message: 'Wishlist fetched successfully',
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
};

// Add Item to Wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    // Check if item already exists in wishlist
    const itemExists = wishlist.items.some((item) => item.productId.toString() === productId);

    if (itemExists) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }

    wishlist.items.push({
      productId,
      name: product.name,
      price: product.price,
      rating: product.rating,
      image: product.image,
    });

    await wishlist.save();

    res.status(200).json({
      message: 'Item added to wishlist',
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
  }
};

// Remove Item from Wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.items = wishlist.items.filter((item) => item.productId.toString() !== productId);

    await wishlist.save();

    res.status(200).json({
      message: 'Item removed from wishlist',
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item from wishlist', error: error.message });
  }
};

// Clear Wishlist
export const clearWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.items = [];

    await wishlist.save();

    res.status(200).json({
      message: 'Wishlist cleared',
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing wishlist', error: error.message });
  }
};

// Check if Item in Wishlist
export const checkItemInWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.query;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(200).json({
        message: 'Item not in wishlist',
        data: { isInWishlist: false },
      });
    }

    const isInWishlist = wishlist.items.some((item) => item.productId.toString() === productId);

    res.status(200).json({
      message: 'Check completed',
      data: { isInWishlist },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking wishlist', error: error.message });
  }
};
