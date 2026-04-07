import crypto from 'node:crypto';
import process from 'node:process';
import Order from '../model/Order.js';
import Product from '../model/Product.js';
import Offer from '../model/Offer.js';
import User from '../model/User.js';
import { sendVerificationEmail } from '../config/mailer.js';

const PAYMENT_SECRET = process.env.PAYMENT_GATEWAY_SECRET || process.env.JWT_SECRET || 'sweetslice-payment-secret';

const buildOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SS-${timestamp}-${random}`;
};

const buildPaymentSignature = ({ orderId, paymentSessionId, status }) =>
  crypto
    .createHmac('sha256', PAYMENT_SECRET)
    .update(`${orderId}:${paymentSessionId}:${status}`)
    .digest('hex');

const sendOrderConfirmationEmail = async (order) => {
  try {
    const user = await User.findById(order.userId).select('email fullName');
    const toEmail = String(user?.email || '').trim();

    if (!toEmail) {
      return;
    }

    const rows = (order.items || [])
      .map((item) => {
        const qty = Number(item.quantity || 0);
        const unit = Number(item.price || 0);
        const line = (qty * unit).toFixed(2);
        return `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${item.name || 'Cake'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">INR ${unit.toFixed(2)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">INR ${line}</td></tr>`;
      })
      .join('');

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#2b1a13;max-width:720px;margin:0 auto;">
        <h2 style="margin-bottom:8px;">SweetSlice Order Confirmation</h2>
        <p style="margin-top:0;color:#5f4c42;">Hi ${user?.fullName || 'Customer'}, your order has been confirmed.</p>
        <div style="background:#fff7f1;border:1px solid #f0ddd2;border-radius:12px;padding:14px 16px;margin-bottom:14px;">
          <p style="margin:0 0 6px 0;"><strong>Order Number:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin:0 0 6px 0;"><strong>Payment Method:</strong> ${order.paymentMethod || '-'}</p>
          <p style="margin:0;"><strong>Order Total:</strong> INR ${Number(order.totalAmount || 0).toFixed(2)}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="background:#6f4a33;color:#fff;">
              <th style="padding:10px;text-align:left;">Item</th>
              <th style="padding:10px;text-align:center;">Qty</th>
              <th style="padding:10px;text-align:right;">Unit</th>
              <th style="padding:10px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:14px;color:#5f4c42;">You can track this order from your profile under Order History.</p>
      </div>
    `;

    await sendVerificationEmail({
      toEmail,
      subject: `Order Confirmed - ${order.orderNumber || String(order._id).slice(-8).toUpperCase()}`,
      html,
    });

    order.confirmationEmailSentAt = new Date();
    await order.save();
  } catch (error) {
    // Mail failures should not block checkout completion.
    console.error('[Order] Confirmation email send failed:', error.message || error);
  }
};

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

    const serverSubtotal = Number(
      trustedItems
        .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
        .toFixed(2)
    );

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
        return res.status(400).json({ message: `Coupon requires minimum purchase of INR ${minPurchase}` });
      }

      let eligibleSubtotal = serverSubtotal;
      if (Array.isArray(offer.applicableProducts) && offer.applicableProducts.length > 0) {
        const applicableIds = new Set(offer.applicableProducts.map((id) => String(id)));
        eligibleSubtotal = Number(
          trustedItems
            .filter((item) => applicableIds.has(String(item.productId)))
            .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
            .toFixed(2)
        );

        if (eligibleSubtotal <= 0) {
          return res.status(400).json({ message: 'Coupon is not applicable to items in this cart' });
        }
      }

      serverDiscount =
        offer.discountType === 'fixed'
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

    const orderNumber = buildOrderNumber();

    const newOrder = new Order({
      orderNumber,
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
      paymentGateway: normalizedPaymentMethod === 'cod' ? 'manual' : 'mockpay',
    });

    await newOrder.save();

    if (normalizedPaymentMethod === 'cod') {
      newOrder.status = 'processing';
      await newOrder.save();
      await sendOrderConfirmationEmail(newOrder);
    }

    res.status(201).json({
      message: 'Order created successfully',
      data: newOrder,
      paymentRequired: normalizedPaymentMethod !== 'cod',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

export const initiateOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.paymentMethod || '').toLowerCase() === 'cod') {
      return res.status(400).json({ message: 'COD orders do not require online payment' });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Payment already completed for this order' });
    }

    const paymentSessionId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const gatewayReference = `GW-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const signedToken = buildPaymentSignature({
      orderId: String(order._id),
      paymentSessionId,
      status: 'initiated',
    });

    order.paymentGateway = 'mockpay';
    order.paymentInitiatedAt = new Date();
    order.paymentFailureReason = '';
    await order.save();

    res.status(200).json({
      message: 'Payment initiated',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount || 0),
        currency: 'INR',
        paymentSessionId,
        gatewayReference,
        signedToken,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error initiating payment', error: error.message });
  }
};

export const verifyOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      paymentStatus,
      paymentSessionId,
      signedToken,
      transactionId,
      failureReason,
    } = req.body;

    const normalizedStatus = String(paymentStatus || '').toLowerCase();
    if (!['completed', 'failed'].includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid payment status. Use completed or failed.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!paymentSessionId || !signedToken) {
      return res.status(400).json({ message: 'Payment session and signature are required' });
    }

    const expectedToken = buildPaymentSignature({
      orderId: String(order._id),
      paymentSessionId: String(paymentSessionId),
      status: 'initiated',
    });

    if (expectedToken !== String(signedToken)) {
      return res.status(400).json({ message: 'Payment signature mismatch' });
    }

    order.paymentVerifiedAt = new Date();

    if (normalizedStatus === 'completed') {
      const txId = String(transactionId || '').trim();
      if (!txId) {
        return res.status(400).json({ message: 'Transaction ID is required for completed payments' });
      }

      order.paymentStatus = 'completed';
      order.paymentTransactionId = txId;
      order.paymentFailureReason = '';
      if (order.status === 'pending') {
        order.status = 'processing';
      }
      await order.save();
      await sendOrderConfirmationEmail(order);

      return res.status(200).json({
        message: 'Payment verified successfully',
        data: order,
      });
    }

    order.paymentStatus = 'failed';
    order.paymentFailureReason = String(failureReason || 'Payment failed at gateway').trim();
    order.paymentTransactionId = '';
    order.status = 'pending';
    await order.save();

    return res.status(200).json({
      message: 'Payment marked as failed. You can retry payment.',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
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

    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('items.productId');

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
