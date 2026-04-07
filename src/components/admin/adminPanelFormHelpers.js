export const createInitialCategoryForm = () => ({
  name: '',
  description: '',
});

export const createInitialProductForm = () => ({
  name: '',
  category: 'Birthday Cakes',
  price: '',
  image: '',
  description: '',
  rating: '4.5',
  quantity: '0',
  inStock: true,
});

export const createInitialUserForm = () => ({
  email: '',
  fullName: '',
  mobile: '',
  password: '',
  gender: 'other',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  profilePicture: '',
});

export const createInitialOrderForm = () => ({
  userId: '',
  totalAmount: '',
  subtotalAmount: '',
  discountAmount: '',
  couponCode: '',
  couponTitle: '',
  status: 'pending',
  paymentStatus: 'pending',
  paymentMethod: 'cod',
  itemsText: '[{"productId":"","name":"","price":0,"quantity":1}]',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  wantsCustomization: false,
  customizationNote: '',
  deliveryDate: '',
  deliverySlot: 'morning',
});

export const createInitialOfferForm = () => ({
  title: '',
  description: '',
  discountPercentage: '0',
  discountType: 'percentage',
  discountValue: '0',
  applicableProducts: [],
  startDate: '',
  endDate: '',
  isActive: true,
  image: '',
  code: '',
  minPurchaseAmount: '0',
  bannerText: 'Limited Time Offer',
});

export const createInitialContactForm = () => ({
  name: '',
  email: '',
  mobile: '',
  subject: '',
  message: '',
  reply: '',
  status: 'Pending',
});

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isNumericText = (value) => /^\d+$/.test(String(value || '').trim());
const isValidUrl = (value) => /^https?:\/\/\S+$/i.test(String(value || '').trim());

export const validateProductForm = (productForm) => {
  const fieldErrors = {};

  if (!productForm.name.trim()) fieldErrors.name = 'Product name is required';
  else if (productForm.name.trim().length < 3) fieldErrors.name = 'Product name must be at least 3 characters';

  if (!productForm.description.trim()) fieldErrors.description = 'Product description is required';
  else if (productForm.description.trim().length < 10) fieldErrors.description = 'Product description must be at least 10 characters';

  const price = Number(productForm.price);
  if (Number.isNaN(price)) fieldErrors.price = 'Product price must be a number';
  else if (price <= 0) fieldErrors.price = 'Product price must be greater than 0';

  const rating = Number(productForm.rating);
  if (Number.isNaN(rating) || rating < 0 || rating > 5) fieldErrors.rating = 'Product rating must be between 0 and 5';

  const quantity = Number(productForm.quantity);
  if (Number.isNaN(quantity) || quantity < 0) fieldErrors.quantity = 'Product quantity cannot be negative';

  if (productForm.image.trim() && !isValidUrl(productForm.image)) fieldErrors.image = 'Product image must be a valid URL';

  return fieldErrors;
};

export const validateUserForm = (userForm, isEdit) => {
  const fieldErrors = {};

  if (!userForm.fullName.trim()) fieldErrors.fullName = 'User full name is required';
  else if (userForm.fullName.trim().length < 3) fieldErrors.fullName = 'User full name must be at least 3 characters';

  if (!userForm.email.trim()) fieldErrors.email = 'User email is required';
  else if (!isValidEmail(userForm.email)) fieldErrors.email = 'User email is invalid';

  if (!userForm.mobile.trim()) fieldErrors.mobile = 'User mobile number is required';
  else if (!isNumericText(userForm.mobile)) fieldErrors.mobile = 'User mobile number must contain digits only';
  else if (userForm.mobile.trim().length < 10 || userForm.mobile.trim().length > 15) fieldErrors.mobile = 'User mobile must be 10 to 15 digits';

  if (!isEdit && !userForm.password.trim()) fieldErrors.password = 'User password is required';
  else if (userForm.password.trim() && userForm.password.trim().length < 8) fieldErrors.password = 'User password must be at least 8 characters';

  if (userForm.zipCode.trim()) {
    if (!isNumericText(userForm.zipCode)) fieldErrors.zipCode = 'User ZIP code must contain digits only';
    else if (userForm.zipCode.trim().length < 4 || userForm.zipCode.trim().length > 10) fieldErrors.zipCode = 'User ZIP code must be 4 to 10 digits';
  }

  if (userForm.profilePicture.trim() && !isValidUrl(userForm.profilePicture)) fieldErrors.profilePicture = 'Profile picture must be a valid URL';

  return fieldErrors;
};

export const validateOrderForm = (orderForm) => {
  const fieldErrors = {};

  if (!orderForm.userId.trim()) fieldErrors.userId = 'Order user ID is required';

  const totalAmount = Number(orderForm.totalAmount);
  if (Number.isNaN(totalAmount) || totalAmount <= 0) fieldErrors.totalAmount = 'Order total amount must be greater than 0';

  let parsedItems;
  try {
    parsedItems = JSON.parse(orderForm.itemsText);
  } catch {
    fieldErrors.itemsText = 'Order items must be valid JSON';
  }

  if (!Array.isArray(parsedItems) || parsedItems.length === 0) fieldErrors.itemsText = 'Order must include at least one item';

  const invalidItem = Array.isArray(parsedItems) ? parsedItems.find((item) => {
    const price = Number(item?.price);
    const quantity = Number(item?.quantity);
    return !item?.name || Number.isNaN(price) || price < 0 || Number.isNaN(quantity) || quantity <= 0;
  }) : null;

  if (invalidItem) fieldErrors.itemsText = 'Each order item must have name, valid price and quantity greater than 0';

  if (!orderForm.street.trim()) fieldErrors.street = 'Shipping street is required';
  if (!orderForm.city.trim()) fieldErrors.city = 'Shipping city is required';
  if (!orderForm.state.trim()) fieldErrors.state = 'Shipping state is required';
  if (!orderForm.zipCode.trim()) fieldErrors.zipCode = 'Shipping ZIP code is required';
  else if (!isNumericText(orderForm.zipCode)) fieldErrors.zipCode = 'Shipping ZIP code must contain digits only';
  if (!orderForm.country.trim()) fieldErrors.country = 'Shipping country is required';

  if (orderForm.deliveryDate.trim()) {
    const selectedDate = new Date(orderForm.deliveryDate);
    if (Number.isNaN(selectedDate.getTime())) fieldErrors.deliveryDate = 'Delivery date must be valid';
  }

  return { fieldErrors, parsedItems: Array.isArray(parsedItems) ? parsedItems : null };
};

export const validateOfferForm = (offerForm) => {
  const fieldErrors = {};

  if (!offerForm.title.trim()) fieldErrors.title = 'Offer title is required';
  if (!offerForm.description.trim()) fieldErrors.description = 'Offer description is required';

  const discountPercentage = Number(offerForm.discountPercentage);
  if (Number.isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
    fieldErrors.discountPercentage = 'Discount percentage must be between 0 and 100';
  }

  const discountValue = Number(offerForm.discountValue);
  if (Number.isNaN(discountValue) || discountValue < 0) fieldErrors.discountValue = 'Discount value cannot be negative';

  const minPurchaseAmount = Number(offerForm.minPurchaseAmount);
  if (Number.isNaN(minPurchaseAmount) || minPurchaseAmount < 0) fieldErrors.minPurchaseAmount = 'Minimum purchase amount cannot be negative';

  if (!offerForm.startDate) fieldErrors.startDate = 'Offer start date is required';
  if (!offerForm.endDate) fieldErrors.endDate = 'Offer end date is required';
  if (offerForm.startDate && offerForm.endDate && new Date(offerForm.endDate) < new Date(offerForm.startDate)) {
    fieldErrors.endDate = 'Offer end date must be after start date';
  }

  if (offerForm.image.trim() && !isValidUrl(offerForm.image)) fieldErrors.image = 'Offer image must be a valid URL';
  if (offerForm.code.trim() && !/^[A-Za-z0-9_-]+$/.test(offerForm.code.trim())) {
    fieldErrors.code = 'Offer code can only contain letters, numbers, underscore and hyphen';
  }

  return fieldErrors;
};

export const validateContactForm = (contactForm) => {
  const fieldErrors = {};

  if (!contactForm.name.trim()) fieldErrors.name = 'Contact name is required';
  if (!contactForm.email.trim()) fieldErrors.email = 'Contact email is required';
  else if (!isValidEmail(contactForm.email)) fieldErrors.email = 'Contact email is invalid';
  if (!contactForm.subject.trim()) fieldErrors.subject = 'Contact subject is required';
  if (!contactForm.message.trim()) fieldErrors.message = 'Contact message is required';

  if (contactForm.mobile.trim()) {
    if (!isNumericText(contactForm.mobile)) fieldErrors.mobile = 'Contact mobile must contain digits only';
    else if (contactForm.mobile.trim().length < 10 || contactForm.mobile.trim().length > 15) fieldErrors.mobile = 'Contact mobile must be 10 to 15 digits';
  }

  if (contactForm.status === 'Replied' && !contactForm.reply.trim()) fieldErrors.reply = 'Reply is required when status is Replied';

  return fieldErrors;
};

export const validateCategoryForm = ({ categoryForm, productCategories, editingCategory }) => {
  const fieldErrors = {};

  if (!categoryForm.name.trim()) {
    fieldErrors.name = 'Category name is required';
  } else if (categoryForm.name.trim().length < 2) {
    fieldErrors.name = 'Category name must be at least 2 characters';
  }

  if (categoryForm.description.trim() && categoryForm.description.trim().length < 5) {
    fieldErrors.description = 'Description should be at least 5 characters';
  }

  const nextName = categoryForm.name.trim().toLowerCase();
  const duplicate = productCategories.find(
    (categoryName) =>
      categoryName.toLowerCase() === nextName &&
      categoryName !== editingCategory
  );

  if (duplicate) {
    fieldErrors.name = 'Category already exists';
  }

  return fieldErrors;
};
