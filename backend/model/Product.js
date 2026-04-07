import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    isVerifiedBuyer: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderatedBy: {
      type: String,
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Birthday Cakes',
        'Wedding Cakes',
        'Specialty Cakes',
        'Cupcakes',
        'Mini Cakes',
        'Chocolate',
        'Vanilla',
        'Cheesecake',
        'Special',
      ],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    image: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedReviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
