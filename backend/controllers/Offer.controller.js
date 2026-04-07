import Offer from '../model/Offer.js';
import Product from '../model/Product.js';

const createDefaultOffersIfMissing = async () => {
  const now = new Date();
  const existingActive = await Offer.countDocuments({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  if (existingActive > 0) return;

  const products = await Product.find({ inStock: true }).select('_id').limit(8);
  if (!products.length) return;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 1);

  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  const chunkA = products.slice(0, 2).map((item) => item._id);
  const chunkB = products.slice(2, 4).map((item) => item._id);
  const chunkC = products.slice(4, 6).map((item) => item._id);
  const chunkD = products.slice(6, 8).map((item) => item._id);

  const defaultOffers = [
    {
      title: 'Birthday Bliss Deal',
      description: 'Save on select birthday cakes for a limited time.',
      discountPercentage: 15,
      discountType: 'percentage',
      discountValue: 15,
      applicableProducts: chunkA,
      startDate,
      endDate,
      isActive: true,
      minPurchaseAmount: 300,
      bannerText: 'Freshly baked savings',
    },
    {
      title: 'Wedding Premium Offer',
      description: 'Exclusive reduction on selected wedding cakes.',
      discountPercentage: 12,
      discountType: 'percentage',
      discountValue: 12,
      applicableProducts: chunkB,
      startDate,
      endDate,
      isActive: true,
      minPurchaseAmount: 1000,
      bannerText: 'Make your day sweeter',
    },
    {
      title: 'Cupcake Combo Discount',
      description: 'Special price drop on selected cupcake boxes.',
      discountPercentage: 10,
      discountType: 'percentage',
      discountValue: 10,
      applicableProducts: chunkC,
      startDate,
      endDate,
      isActive: true,
      minPurchaseAmount: 200,
      bannerText: 'Perfect for tea-time',
    },
    {
      title: 'Mini Cakes Flash Offer',
      description: 'Quick grab deal for mini cakes and small celebrations.',
      discountPercentage: 18,
      discountType: 'percentage',
      discountValue: 18,
      applicableProducts: chunkD,
      startDate,
      endDate,
      isActive: true,
      minPurchaseAmount: 250,
      bannerText: 'Flash sale live now',
    },
  ].filter((offer) => offer.applicableProducts.length > 0);

  if (!defaultOffers.length) return;

  await Offer.insertMany(defaultOffers, { ordered: false });
};

export const createOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      discountPercentage,
      discountType,
      discountValue,
      applicableProducts,
      startDate,
      endDate,
      image,
      code,
      minPurchaseAmount,
      bannerText,
    } = req.body;

    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, start date, and end date are required',
      });
    }

    const newOffer = new Offer({
      title,
      description,
      discountPercentage,
      discountType,
      discountValue,
      applicableProducts: applicableProducts || [],
      startDate,
      endDate,
      image,
      code,
      minPurchaseAmount: minPurchaseAmount || 0,
      bannerText: bannerText || 'Limited Time Offer',
    });

    const savedOffer = await newOffer.save();

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: savedOffer,
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating offer',
      error: error.message,
    });
  }
};

export const getActiveOffers = async (req, res) => {
  try {
    await createDefaultOffersIfMissing();

    const currentDate = new Date();

    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    })
      .populate('applicableProducts', 'name image price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Active offers retrieved successfully',
      data: activeOffers,
    });
  } catch (error) {
    console.error('Error fetching active offers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active offers',
      error: error.message,
    });
  }
};

export const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('applicableProducts', 'name image price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Offers retrieved successfully',
      data: offers,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message,
    });
  }
};

export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id).populate(
      'applicableProducts',
      'name image price'
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer retrieved successfully',
      data: offer,
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offer',
      error: error.message,
    });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedOffer = await Offer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('applicableProducts', 'name image price');

    if (!updatedOffer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      data: updatedOffer,
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating offer',
      error: error.message,
    });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOffer = await Offer.findByIdAndDelete(id);

    if (!deletedOffer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
      data: deletedOffer,
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting offer',
      error: error.message,
    });
  }
};

export const validateOfferCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Offer code is required',
      });
    }

    const currentDate = new Date();
    const offer = await Offer.findOne({
      code,
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired offer code',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer code is valid',
      data: offer,
    });
  } catch (error) {
    console.error('Error validating offer code:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating offer code',
      error: error.message,
    });
  }
};
