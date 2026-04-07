import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    subtotalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      trim: true,
      default: '',
    },
    couponTitle: {
      type: String,
      trim: true,
      default: '',
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    deliveryDate: {
      type: String,
      default: '',
    },
    deliverySlot: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin', 'system'],
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentGateway: {
      type: String,
      enum: ['mockpay', 'manual', 'none'],
      default: 'none',
    },
    paymentTransactionId: {
      type: String,
      trim: true,
      default: '',
    },
    paymentFailureReason: {
      type: String,
      trim: true,
      default: '',
    },
    paymentInitiatedAt: {
      type: Date,
      default: null,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
    confirmationEmailSentAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['credit-card', 'credit_card', 'paypal', 'bank-transfer', 'upi', 'cod', 'razorpay'],
    },
    wantsCustomization: {
      type: Boolean,
      default: false,
    },
    customizationNote: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
