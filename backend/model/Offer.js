import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '',
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    bannerText: {
      type: String,
      default: 'Limited Time Offer',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Offer', offerSchema);
