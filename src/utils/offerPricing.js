const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getCartProductId = (item) => String(item?.productId || item?.id || item?._id || '').trim();

const getOfferProductIds = (offer) => {
  if (!Array.isArray(offer?.applicableProducts)) return [];

  return offer.applicableProducts
    .map((product) => {
      if (product && typeof product === 'object') {
        return String(product._id || product.id || '').trim();
      }

      return String(product || '').trim();
    })
    .filter(Boolean);
};

const getMatchingOffersForProduct = ({ productId, offers = [], subtotal = 0 }) => {
  const numericSubtotal = toNumber(subtotal);

  return offers.filter((offer) => {
    const minPurchaseAmount = toNumber(offer?.minPurchaseAmount);
    const offerProductIds = getOfferProductIds(offer);
    return numericSubtotal >= minPurchaseAmount && offerProductIds.includes(String(productId || '').trim());
  });
};

export const calculateBestOfferForItem = ({ item = {}, offers = [], subtotal = 0 }) => {
  const productId = getCartProductId(item);
  const quantity = Math.max(1, toNumber(item?.quantity || 1));
  const unitPrice = toNumber(item?.price);
  const itemTotal = Number((unitPrice * quantity).toFixed(2));

  if (!productId || itemTotal <= 0 || !Array.isArray(offers) || !offers.length) {
    return {
      discountAmount: 0,
      discountedUnitPrice: unitPrice,
      discountedLineTotal: itemTotal,
      offerTitle: '',
      offerBadge: '',
    };
  }

  const matchingOffers = getMatchingOffersForProduct({ productId, offers, subtotal });
  if (!matchingOffers.length) {
    return {
      discountAmount: 0,
      discountedUnitPrice: unitPrice,
      discountedLineTotal: itemTotal,
      offerTitle: '',
      offerBadge: '',
    };
  }

  let bestDiscount = 0;
  let bestOffer = null;

  matchingOffers.forEach((offer) => {
    const discountType = String(offer?.discountType || 'percentage').toLowerCase();
    const candidateDiscount = discountType === 'fixed'
      ? Math.min(toNumber(offer?.discountValue), itemTotal)
      : (itemTotal * toNumber(offer?.discountPercentage)) / 100;

    if (candidateDiscount > bestDiscount) {
      bestDiscount = candidateDiscount;
      bestOffer = offer;
    }
  });

  const discountAmount = Number(bestDiscount.toFixed(2));
  const discountedLineTotal = Number(Math.max(itemTotal - discountAmount, 0).toFixed(2));
  const discountedUnitPrice = Number((discountedLineTotal / quantity).toFixed(2));

  let offerBadge = '';
  if (bestOffer) {
    const discountType = String(bestOffer?.discountType || 'percentage').toLowerCase();
    offerBadge = discountType === 'fixed'
      ? `INR ${toNumber(bestOffer?.discountValue).toFixed(0)} OFF`
      : `${toNumber(bestOffer?.discountPercentage).toFixed(0)}% OFF`;
  }

  return {
    discountAmount,
    discountedUnitPrice,
    discountedLineTotal,
    offerTitle: String(bestOffer?.title || '').trim(),
    offerBadge,
  };
};

export const calculateAutomaticOfferDiscount = ({ cartItems = [], offers = [], subtotal = 0 }) => {
  if (!Array.isArray(cartItems) || !cartItems.length || !Array.isArray(offers) || !offers.length) {
    return { discountAmount: 0, offerTitle: '' };
  }

  const numericSubtotal = toNumber(subtotal);
  let discountTotal = 0;
  const appliedTitles = new Set();

  cartItems.forEach((item) => {
    const bestOffer = calculateBestOfferForItem({
      item,
      offers,
      subtotal: numericSubtotal,
    });

    if (bestOffer.discountAmount > 0) {
      discountTotal += bestOffer.discountAmount;
      if (bestOffer.offerTitle) appliedTitles.add(bestOffer.offerTitle);
    }
  });

  const discountAmount = Number(discountTotal.toFixed(2));
  const offerTitle = appliedTitles.size === 1
    ? [...appliedTitles][0]
    : appliedTitles.size > 1
      ? 'Auto Product Offers'
      : '';

  return { discountAmount, offerTitle };
};
