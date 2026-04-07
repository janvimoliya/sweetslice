import Order from '../model/Order.js';
import Product from '../model/Product.js';
import Offer from '../model/Offer.js';

// Create Order
export const createOrder = async (req, res) => {
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
      wantsCustomization,
      customizationNote,
      deliveryDate,
      deliverySlot,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have items' });
    }

    const normalizedPaymentMethod = paymentMethod === 'credit_card' ? 'credit-card' : paymentMethod;
    const hasCustomization = wantsCustomization === true || wantsCustomization === 'true';
    const numericSubtotalAmount = Number(subtotalAmount ?? totalAmount ?? 0);
    const numericTotalAmount = Number(totalAmount ?? subtotalAmount ?? 0);
    const numericDiscountAmount = Number(discountAmount ?? Math.max(numericSubtotalAmount - numericTotalAmount, 0));
    const normalizedCouponCode = String(couponCode || '').trim();
    const normalizedCouponTitle = String(couponTitle || '').trim();
    const normalizedDeliveryDate = String(deliveryDate || '').trim();
    const normalizedDeliverySlot = String(deliverySlot || '').trim();

    if (Number.isNaN(numericSubtotalAmount) || numericSubtotalAmount < 0) {
      return res.status(400).json({ message: 'Subtotal amount must be a valid number' });
    }

    if (Number.isNaN(numericTotalAmount) || numericTotalAmount < 0) {
      return res.status(400).json({ message: 'Total amount must be a valid number' });
    }

    if (Number.isNaN(numericDiscountAmount) || numericDiscountAmount < 0) {
      return res.status(400).json({ message: 'Discount amount must be a valid number' });
    }

    if (normalizedDeliveryDate) {
      const selectedDate = new Date(normalizedDeliveryDate);
      if (Number.isNaN(selectedDate.getTime())) {
        return res.status(400).json({ message: 'Delivery date must be a valid date' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return res.status(400).json({ message: 'Delivery date cannot be in the past' });
      }
    }

    const allowedDeliverySlots = ['morning', 'afternoon', 'evening'];
    if (normalizedDeliverySlot && !allowedDeliverySlots.includes(normalizedDeliverySlot)) {
      return res.status(400).json({ message: 'Delivery slot must be morning, afternoon, or evening' });
    }

    const normalizedItems = items.map((item) => ({
      productId: String(item.productId || item.id || '').trim(),
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
    }));

    if (normalizedItems.some((item) => !item.productId || Number.isNaN(item.quantity) || item.quantity <= 0)) {
      return res.status(400).json({ message: 'Each order item must include a valid product and quantity' });
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const dbProducts = await Product.find({ _id: { $in: productIds } }).select('_id name price');

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products in the order are invalid' });
    }

    const productMap = new Map(dbProducts.map((product) => [String(product._id), product]));
    const trustedItems = normalizedItems.map((item) => {
      const dbProduct = productMap.get(String(item.productId));
      return {
        productId: dbProduct._id,
        name: dbProduct.name || item.name || 'Product',
        price: Number(dbProduct.price || 0),
        quantity: item.quantity,
      };
    });

    const serverSubtotal = Number(trustedItems
      .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
      .toFixed(2));

    let serverDiscount = 0;
    let resolvedCouponCode = '';
    let resolvedCouponTitle = '';

    if (normalizedCouponCode) {
      const currentDate = new Date();
      const offer = await Offer.findOne({
        code: normalizedCouponCode,
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      }).select('title code discountType discountPercentage discountValue minPurchaseAmount applicableProducts');

      if (!offer) {
        return res.status(400).json({ message: 'Invalid or expired coupon code' });
      }

      const minPurchase = Number(offer.minPurchaseAmount || 0);
      if (serverSubtotal < minPurchase) {
        return res.status(400).json({ message: `Coupon requires minimum purchase of ₹${minPurchase}` });
      }

      let eligibleSubtotal = serverSubtotal;
      if (Array.isArray(offer.applicableProducts) && offer.applicableProducts.length > 0) {
        const applicableIds = new Set(offer.applicableProducts.map((id) => String(id)));
        eligibleSubtotal = Number(trustedItems
          .filter((item) => applicableIds.has(String(item.productId)))
          .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
          .toFixed(2));

        if (eligibleSubtotal <= 0) {
          return res.status(400).json({ message: 'Coupon is not applicable to items in this cart' });
        }
      }

      serverDiscount = offer.discountType === 'fixed'
        ? Math.min(Number(offer.discountValue || 0), eligibleSubtotal)
        : (eligibleSubtotal * Number(offer.discountPercentage || 0)) / 100;

      serverDiscount = Number(serverDiscount.toFixed(2));
      resolvedCouponCode = String(offer.code || normalizedCouponCode).trim();
      resolvedCouponTitle = String(offer.title || normalizedCouponTitle).trim();
    }

    const discountedSubtotal = Math.max(serverSubtotal - serverDiscount, 0);
    const serverTax = Number((discountedSubtotal * 0.1).toFixed(2));
    const serverShipping = discountedSubtotal > 50 ? 0 : 5;
    const serverTotal = Number((discountedSubtotal + serverTax + serverShipping).toFixed(2));

    if (!Number.isNaN(numericTotalAmount) && numericTotalAmount > 0 && Math.abs(numericTotalAmount - serverTotal) > 1) {
      return res.status(400).json({
        message: 'Order total mismatch. Please review your cart and try again.',
        data: {
          expectedTotal: serverTotal,
          expectedSubtotal: serverSubtotal,
          expectedDiscount: serverDiscount,
        },
      });
    }

    const newOrder = new Order({
      userId,
      items: trustedItems,
      subtotalAmount: serverSubtotal,
      discountAmount: serverDiscount,
      totalAmount: serverTotal,
      couponCode: resolvedCouponCode,
      couponTitle: resolvedCouponTitle,
      shippingAddress,
      paymentMethod: normalizedPaymentMethod,
      wantsCustomization: hasCustomization,
      customizationNote: hasCustomization ? String(customizationNote || '').trim() : '',
      deliveryDate: normalizedDeliveryDate,
      deliverySlot: normalizedDeliverySlot,
      status: 'pending',
      paymentStatus: 'pending',
    });

    await newOrder.save();

    res.status(201).json({
      message: 'Order created successfully',
      data: newOrder,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'fullName email mobile');

    res.status(200).json({
      message: 'Orders fetched successfully',
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get Orders by User ID
export const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId }).populate('items.productId');

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    res.status(200).json({
      message: 'User orders fetched',
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('userId', 'fullName email mobile')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order fetched', data: order });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    const updateData = {};
    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid order status' });
      }

      updateData.status = normalizedStatus;
    }

    if (paymentStatus) {
      const normalizedPaymentStatus = String(paymentStatus).toLowerCase();
      if (!['pending', 'completed', 'failed'].includes(normalizedPaymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }

      updateData.paymentStatus = normalizedPaymentStatus;
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized to cancel this order' });
    }

    if (String(order.userId) !== String(req.userId)) {
      return res.status(403).json({ message: 'You can only cancel your own order' });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = 'customer';
    await order.save();

    res.status(200).json({
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order deleted successfully',
      data: deletedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};
