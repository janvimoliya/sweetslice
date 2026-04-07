import Cart from '../model/Cart.js';
import Product from '../model/Product.js';

// Get Cart by User ID
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    let cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      return res.status(404).json({
        message: 'Cart not found',
        data: { items: [], totalPrice: 0 },
      });
    }

    res.status(200).json({
      message: 'Cart fetched successfully',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

// Add Item to Cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find((item) => item.productId.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      });
    }

    // Calculate total price
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    await cart.save();

    res.status(200).json({
      message: 'Item added to cart',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

// Update Cart Item Quantity
export const updateCartItem = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find((item) => item.productId.toString() === productId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = quantity;

    // Calculate total price
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    await cart.save();

    res.status(200).json({
      message: 'Cart item updated',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

// Remove Item from Cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);

    // Calculate total price
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    await cart.save();

    res.status(200).json({
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item from cart', error: error.message });
  }
};

// Clear Cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.totalPrice = 0;

    await cart.save();

    res.status(200).json({
      message: 'Cart cleared',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};
