import Review from '../model/Review.js';

export const calculateRatingSummary = (reviews = []) => {
  const allReviews = Array.isArray(reviews) ? reviews : [];
  const approvedReviews = allReviews.filter((review) => review?.status === 'approved');
  const approvedCount = approvedReviews.length;

  if (approvedCount === 0) {
    return {
      averageRating: 0,
      approvedReviewCount: 0,
      reviewCount: allReviews.length,
    };
  }

  const averageRating = approvedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / approvedCount;

  return {
    averageRating: Number(averageRating.toFixed(1)),
    approvedReviewCount: approvedCount,
    reviewCount: allReviews.length,
  };
};

export const applyProductRatingSummary = (product) => {
  const hasEmbeddedReviews = Array.isArray(product?.reviews) && product.reviews.length > 0;
  if (!hasEmbeddedReviews) {
    return product;
  }

  const { averageRating, approvedReviewCount, reviewCount } = calculateRatingSummary(product?.reviews || []);
  product.rating = averageRating;
  product.approvedReviewCount = approvedReviewCount;
  product.reviewCount = reviewCount;
  return product;
};

export const syncProductRatingFromReviewCollection = async (productId) => {
  const [totals] = await Review.aggregate([
    {
      $match: {
        productId,
      },
    },
    {
      $group: {
        _id: '$productId',
        reviewCount: { $sum: 1 },
        approvedReviewCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, 1, 0],
          },
        },
        approvedRatingSum: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, '$rating', 0],
          },
        },
      },
    },
  ]);

  const reviewCount = Number(totals?.reviewCount || 0);
  const approvedReviewCount = Number(totals?.approvedReviewCount || 0);
  const averageRating = approvedReviewCount > 0
    ? Number((Number(totals?.approvedRatingSum || 0) / approvedReviewCount).toFixed(1))
    : 0;

  return {
    averageRating,
    approvedReviewCount,
    reviewCount,
  };
};
