import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { rules, useFormValidation, validateField } from '../validation/formValidation';
import { initiateRazorpayPayment, verifyRazorpaySignature } from '../utils/RazorpayPaymentHandler';
import '../styles/CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [activeTab, setActiveTab] = useState('shipping');
  const [promoCode, setPromoCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [retryPaymentContext, setRetryPaymentContext] = useState(null);

  const apiBaseUrl = 'http://localhost:5000';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    if (!userId && !userToken) {
      navigate('/login', { state: { redirectTo: '/checkout' } });
    }

    if (cart.length === 0 && !retryPaymentContext) {
      navigate('/cart');
    }
  }, [userId, cart.length, navigate, retryPaymentContext]);

  const validationRules = {
    fullName: [rules.required('Full name is required'), rules.minLength(3)],
    email: [rules.required('Email is required'), rules.email()],
    mobile: [rules.required('Mobile is required'), rules.numeric(), rules.minLength(10), rules.maxLength(15)],
    street: [rules.required('Street address is required'), rules.minLength(5)],
    city: [rules.required('City is required'), rules.minLength(2)],
    state: [rules.required('State is required'), rules.minLength(2)],
    zipCode: [rules.required('ZIP code is required'), rules.numeric(), rules.minLength(4), rules.maxLength(10)],
    deliveryDate: [
      rules.required('Delivery date is required'),
      (value) => {
        if (!value) return '';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        return selectedDate >= today ? '' : 'Delivery date cannot be in the past';
      },
    ],
    deliverySlot: [rules.required('Delivery slot is required')],
    cardName: [
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.required('Cardholder name is required')(value)
          : '',
    ],
    cardNumber: [
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.required('Card number is required')(value)
          : '',
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.numeric('Card number must contain digits only')(value)
          : '',
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.minLength(16, 'Card number must be 16 digits')(value)
          : '',
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.maxLength(16, 'Card number must be 16 digits')(value)
          : '',
    ],
    expiry: [
      (value, formValues) => {
        if (formValues.paymentMethod !== 'credit-card') return '';
        if (!value || !value.trim()) return 'Expiry date is required';
        return /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(value.trim()) ? '' : 'Use expiry format MM/YY';
      },
    ],
    cvv: [
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.required('CVV is required')(value)
          : '',
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.numeric('CVV must contain digits only')(value)
          : '',
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.minLength(3, 'CVV must be 3 or 4 digits')(value)
          : '',
      (value, formValues) =>
        formValues.paymentMethod === 'credit-card'
          ? rules.maxLength(4, 'CVV must be 3 or 4 digits')(value)
          : '',
    ],
  };

  const { values, errors, setErrors, handleChange, handleBlur, handleSubmit, getInputClass } =
    useFormValidation({
      initialValues: {
        fullName: '',
        email: '',
        mobile: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        wantsCustomization: false,
        customizationNote: '',
        deliveryDate: '',
        deliverySlot: 'morning',
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
        paymentMethod: 'credit-card',
      },
      validationRules,
      onSubmit: async (formValues) => {
        if (retryPaymentContext?.orderId) {
          await handleRetryPayment();
          return;
        }

        setIsSubmitting(true);
        setSubmitMessage('');
        setSubmitError('');

        try {
          if (formValues.paymentMethod === 'credit-card') {
            if (!formValues.cardName?.trim() || !formValues.cardNumber?.trim() || !formValues.cvv?.trim()) {
              throw new Error('Card details are required for card payments');
            }
          }

          const orderData = {
            userId,
            items: cart.map((item) => ({
              productId: item.productId || item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            totalAmount: Number(finalTotal),
            shippingAddress: {
              street: formValues.street,
              city: formValues.city,
              state: formValues.state,
              zipCode: formValues.zipCode,
            },
            paymentMethod: formValues.paymentMethod,
            subtotalAmount: getCartTotal(),
            discountAmount: Number(couponDiscountAmount.toFixed(2)),
            couponCode: appliedCoupon?.code || '',
            couponTitle: appliedCoupon?.title || '',
            wantsCustomization: Boolean(formValues.wantsCustomization),
            customizationNote: formValues.wantsCustomization
              ? formValues.customizationNote?.trim() || ''
              : '',
            deliveryDate: formValues.deliveryDate,
            deliverySlot: formValues.deliverySlot,
            status: 'pending',
            paymentStatus: 'pending',
          };

          const response = await fetch(`${apiBaseUrl}/api/orders/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
          });

          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(result.message || 'Order placement failed');
          }

          const createdOrder = result?.data;
          if (!createdOrder?._id) {
            throw new Error('Order was created but confirmation data is missing');
          }

          if (result.paymentRequired === false || formValues.paymentMethod === 'cod') {
            clearCart();
            navigate(`/order-success/${createdOrder._id}`);
            return;
          }

          try {
            const paymentOutcome = await processOnlinePayment({
              orderId: createdOrder._id,
              paymentMethod: formValues.paymentMethod,
            });

            clearCart();
            navigate(`/order-success/${createdOrder._id}`, {
              state: {
                paymentTransactionId: paymentOutcome.transactionId,
              },
            });
          } catch (paymentError) {
            setRetryPaymentContext({
              orderId: createdOrder._id,
              orderNumber: createdOrder.orderNumber || String(createdOrder._id).slice(-8).toUpperCase(),
              paymentMethod: formValues.paymentMethod,
            });
            throw paymentError;
          }
        } catch (error) {
          setSubmitError(error.message || 'Failed to place order');
        } finally {
          setIsSubmitting(false);
        }
      },
    });

  const processOnlinePayment = async ({ orderId, paymentMethod }) => {
    return new Promise((resolve, reject) => {
      if (paymentMethod === 'razorpay') {
        // Razorpay payment flow
        setIsProcessingPayment(true);
        setSubmitMessage('Connecting to Razorpay...');
        setSubmitError('');

        initiateRazorpayPayment({
          apiBaseUrl,
          orderId,
          orderNumber: `SS-${orderId}`,
          totalAmount: Number(finalTotal),
          userEmail: values.email,
          userName: values.fullName,
          callback: async (paymentResponse) => {
            if (paymentResponse.success) {
              try {
                setSubmitMessage('Verifying payment...');
                const verificationResult = await verifyRazorpaySignature({
                  razorpayPaymentId: paymentResponse.razorpayPaymentId,
                  razorpayOrderId: paymentResponse.razorpayOrderId,
                  razorpaySignature: paymentResponse.razorpaySignature,
                  apiBaseUrl,
                  orderId,
                });

                if (verificationResult.success) {
                  showSuccess('Payment completed successfully!');
                  setSubmitMessage('');
                  setIsProcessingPayment(false);
                  resolve({
                    transactionId: paymentResponse.razorpayPaymentId,
                  });
                } else {
                  throw new Error(verificationResult.error || 'Payment verification failed');
                }
              } catch (error) {
                showError(error.message);
                setSubmitError(error.message);
                setSubmitMessage('');
                setIsProcessingPayment(false);
                reject(error);
              }
            } else {
              const errorMsg = paymentResponse.error || 'Payment cancelled';
              showError(errorMsg);
              setSubmitError(errorMsg);
              setSubmitMessage('');
              setIsProcessingPayment(false);
              reject(new Error(errorMsg));
            }
          },
        });
      } else {
        // Mock payment for testing (credit-card simulation)
        setIsProcessingPayment(true);
        setSubmitMessage('Connecting to secure payment gateway...');
        setSubmitError('');

        setTimeout(async () => {
          try {
            const initiateResponse = await fetch(`${apiBaseUrl}/api/orders/${orderId}/payment/initiate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            const initiateResult = await initiateResponse.json().catch(() => ({}));
            if (!initiateResponse.ok) {
              throw new Error(initiateResult.message || 'Unable to initiate payment');
            }

            const paymentData = initiateResult?.data || {};
            const numericCard = String(values.cardNumber || '').replace(/\D/g, '');
            const shouldFail = paymentMethod === 'credit-card' && numericCard.endsWith('0000');

            if (shouldFail) {
              await fetch(`${apiBaseUrl}/api/orders/${orderId}/payment/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentStatus: 'failed',
                  paymentSessionId: paymentData.paymentSessionId,
                  signedToken: paymentData.signedToken,
                  failureReason: 'Bank declined this card. Please retry with a different card.',
                }),
              });

              throw new Error('Payment failed. Use Retry Payment or update card details and try again.');
            }

            const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

            const verifyResponse = await fetch(`${apiBaseUrl}/api/orders/${orderId}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentStatus: 'completed',
                paymentSessionId: paymentData.paymentSessionId,
                signedToken: paymentData.signedToken,
                transactionId,
              }),
            });

            const verifyResult = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok) {
              throw new Error(verifyResult.message || 'Unable to verify payment');
            }

            showSuccess('Payment completed successfully!');
            setSubmitMessage('');
            setIsProcessingPayment(false);
            resolve({
              transactionId,
            });
          } catch (error) {
            showError(error.message);
            setSubmitError(error.message);
            setSubmitMessage('');
            setIsProcessingPayment(false);
            reject(error);
          }
        }, 1500);
      }
    });
  };

  const handleRetryPayment = async () => {
    if (!retryPaymentContext?.orderId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('Retrying payment...');
    setSubmitError('');

    try {
      const paymentOutcome = await processOnlinePayment({
        orderId: retryPaymentContext.orderId,
        paymentMethod: retryPaymentContext.paymentMethod,
      });

      clearCart();
      navigate(`/order-success/${retryPaymentContext.orderId}`, {
        state: {
          paymentTransactionId: paymentOutcome.transactionId,
        },
      });
    } catch (retryError) {
      setSubmitError(retryError.message || 'Payment retry failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStepFields = (fieldNames) => {
    const nextErrors = { ...errors };
    let hasError = false;

    fieldNames.forEach((fieldName) => {
      const fieldRules = validationRules[fieldName] || [];
      const fieldError = validateField(values[fieldName], fieldRules, values);

      if (fieldError) {
        hasError = true;
        nextErrors[fieldName] = fieldError;
      } else {
        delete nextErrors[fieldName];
      }
    });

    setErrors(nextErrors);
    return !hasError;
  };

  const validateShippingStep = () =>
    validateStepFields(['fullName', 'email', 'mobile', 'street', 'city', 'state', 'zipCode']);

  const validatePaymentStep = () => {
    if (values.paymentMethod !== 'credit-card') return true;
    return validateStepFields(['cardName', 'cardNumber', 'expiry', 'cvv']);
  };

  const goToPaymentStep = () => {
    setSubmitError('');
    if (!validateShippingStep()) {
      setSubmitError('Please complete all shipping fields correctly before continuing');
      return;
    }
    setActiveTab('payment');
  };

  const goToReviewStep = () => {
    setSubmitError('');
    const isShippingValid = validateShippingStep();
    const isPaymentValid = validatePaymentStep();

    if (!isShippingValid || !isPaymentValid) {
      setSubmitError('Please complete shipping and payment details correctly before review');
      return;
    }

    setActiveTab('review');
  };

  const handleTabNavigation = (nextTab) => {
    if (nextTab === 'shipping') {
      setSubmitError('');
      setActiveTab('shipping');
      return;
    }

    if (nextTab === 'payment') {
      goToPaymentStep();
      return;
    }

    goToReviewStep();
  };

  const handleApplyCoupon = async () => {
    const trimmedCode = String(promoCode || '').trim();
    if (!trimmedCode) {
      setCouponError('Enter a promo code first');
      setCouponMessage('');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setCouponMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/offers/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Invalid promo code');
      }

      const offer = result?.data || {};
      const minPurchaseAmount = Number(offer.minPurchaseAmount || 0);

      if (getCartTotal() < minPurchaseAmount) {
        throw new Error(`Minimum order amount for this code is INR ${minPurchaseAmount}`);
      }

      setAppliedCoupon({
        ...offer,
        code: String(offer.code || trimmedCode).trim(),
      });
      setCouponMessage(`Promo code ${String(offer.code || trimmedCode).trim()} applied`);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage('');
      setCouponError(error.message || 'Failed to apply promo code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoCode('');
    setCouponMessage('');
    setCouponError('');
  };

  const cartTotal = getCartTotal();
  const couponDiscountAmount = appliedCoupon
    ? appliedCoupon.discountType === 'fixed'
      ? Math.min(Number(appliedCoupon.discountValue || 0), cartTotal)
      : (cartTotal * Number(appliedCoupon.discountPercentage || 0)) / 100
    : 0;
  const discountedSubtotal = Math.max(cartTotal - couponDiscountAmount, 0);
  const tax = (discountedSubtotal * 0.1).toFixed(2);
  const shippingCharge = discountedSubtotal > 50 ? 0 : 5;
  const finalTotal = (parseFloat(discountedSubtotal) + parseFloat(tax) + shippingCharge).toFixed(2);
  const deliveryDateMin = new Date().toISOString().slice(0, 10);
  const isRetryPending = Boolean(retryPaymentContext?.orderId);

  return (
    <section className="checkout-section">
      <div className="checkout-container">
        <div className="checkout-main">
          <div className="tabs-navigation">
            <button className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => handleTabNavigation('shipping')} type="button">
              <span className="tab-number">1</span>
              <span>Shipping</span>
            </button>
            <button className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => handleTabNavigation('payment')} type="button">
              <span className="tab-number">2</span>
              <span>Payment</span>
            </button>
            <button className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`} onClick={() => handleTabNavigation('review')} type="button">
              <span className="tab-number">3</span>
              <span>Review</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {submitMessage && <div className="alert alert-success">{submitMessage}</div>}
            {submitError && <div className="alert alert-danger">{submitError}</div>}
            {couponMessage && <div className="alert alert-success">{couponMessage}</div>}
            {couponError && <div className="alert alert-danger">{couponError}</div>}

            {activeTab === 'shipping' && (
              <div className="form-section">
                <h3>Shipping Information</h3>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="fullName" className="form-label">Full Name</label>
                    <input id="fullName" name="fullName" type="text" className={getInputClass('fullName')} value={values.fullName} onChange={handleChange} onBlur={handleBlur} placeholder="John Doe" />
                    {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                  </div>
                  <div className="form-group col-md-6">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input id="email" name="email" type="email" className={getInputClass('email')} value={values.email} onChange={handleChange} onBlur={handleBlur} placeholder="john@example.com" />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="mobile" className="form-label">Mobile Number</label>
                    <input id="mobile" name="mobile" type="text" className={getInputClass('mobile')} value={values.mobile} onChange={handleChange} onBlur={handleBlur} placeholder="9876543210" />
                    {errors.mobile && <span className="error-text">{errors.mobile}</span>}
                  </div>
                </div>

                <div className="form-group customization-box">
                  <label className="customization-toggle">
                    <input id="wantsCustomization" name="wantsCustomization" type="checkbox" checked={Boolean(values.wantsCustomization)} onChange={handleChange} />
                    <span>I want customization for this order</span>
                  </label>

                  {values.wantsCustomization && (
                    <>
                      <label htmlFor="customizationNote" className="form-label mt-3">Customization Details (Optional)</label>
                      <textarea id="customizationNote" name="customizationNote" className={getInputClass('customizationNote')} value={values.customizationNote} onChange={handleChange} onBlur={handleBlur} placeholder="Example: Less sugar, blue frosting, add Happy Birthday Rahul" rows="3" maxLength="300" />
                    </>
                  )}
                </div>

                <h4 className="mt-4">Delivery Schedule</h4>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="deliveryDate" className="form-label">Preferred Delivery Date</label>
                    <input id="deliveryDate" name="deliveryDate" type="date" className={getInputClass('deliveryDate')} value={values.deliveryDate} min={deliveryDateMin} onChange={handleChange} onBlur={handleBlur} />
                    {errors.deliveryDate && <span className="error-text">{errors.deliveryDate}</span>}
                  </div>
                  <div className="form-group col-md-6">
                    <label htmlFor="deliverySlot" className="form-label">Delivery Slot</label>
                    <select id="deliverySlot" name="deliverySlot" className={getInputClass('deliverySlot')} value={values.deliverySlot} onChange={handleChange} onBlur={handleBlur}>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                    {errors.deliverySlot && <span className="error-text">{errors.deliverySlot}</span>}
                  </div>
                </div>

                <h4 className="mt-4">Address</h4>
                <div className="form-group">
                  <label htmlFor="street" className="form-label">Street Address</label>
                  <input id="street" name="street" type="text" className={getInputClass('street')} value={values.street} onChange={handleChange} onBlur={handleBlur} placeholder="123 Main Street" />
                  {errors.street && <span className="error-text">{errors.street}</span>}
                </div>

                <div className="form-row address-row">
                  <div className="form-group address-field">
                    <label htmlFor="city" className="form-label">City</label>
                    <input id="city" name="city" type="text" className={getInputClass('city')} value={values.city} onChange={handleChange} onBlur={handleBlur} placeholder="New York" />
                    {errors.city && <span className="error-text">{errors.city}</span>}
                  </div>
                  <div className="form-group address-field">
                    <label htmlFor="state" className="form-label">State</label>
                    <input id="state" name="state" type="text" className={getInputClass('state')} value={values.state} onChange={handleChange} onBlur={handleBlur} placeholder="NY" />
                    {errors.state && <span className="error-text">{errors.state}</span>}
                  </div>
                  <div className="form-group address-field">
                    <label htmlFor="zipCode" className="form-label">ZIP Code</label>
                    <input id="zipCode" name="zipCode" type="text" className={getInputClass('zipCode')} value={values.zipCode} onChange={handleChange} onBlur={handleBlur} placeholder="10001" />
                    {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
                  </div>
                </div>

                <button type="button" className="btn btn-primary checkout-action-btn w-100 mt-4" onClick={goToPaymentStep}>
                  Continue to Payment
                </button>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="form-section">
                <h3>Payment Information</h3>

                <div className="payment-methods">
                  <label className="payment-option">
                    <input type="radio" name="paymentMethod" value="razorpay" checked={values.paymentMethod === 'razorpay'} onChange={handleChange} />
                    <span className="method-label"><i className="bi bi-wallet-fill"></i> Razorpay (Credit/UPI)</span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="paymentMethod" value="credit-card" checked={values.paymentMethod === 'credit-card'} onChange={handleChange} />
                    <span className="method-label"><i className="bi bi-credit-card"></i> Credit/Debit Card (Test)</span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="paymentMethod" value="cod" checked={values.paymentMethod === 'cod'} onChange={handleChange} />
                    <span className="method-label"><i className="bi bi-cash-coin"></i> Cash on Delivery</span>
                  </label>
                </div>

                {values.paymentMethod === 'credit-card' && (
                  <>
                    <div className="form-group mt-4">
                      <label htmlFor="cardName" className="form-label">Cardholder Name</label>
                      <input id="cardName" name="cardName" type="text" className={getInputClass('cardName')} value={values.cardName} onChange={handleChange} onBlur={handleBlur} placeholder="John Doe" />
                      {errors.cardName && <span className="error-text">{errors.cardName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cardNumber" className="form-label">Card Number</label>
                      <input id="cardNumber" name="cardNumber" type="text" className={getInputClass('cardNumber')} value={values.cardNumber} onChange={handleChange} onBlur={handleBlur} placeholder="1234 5678 9012 3456" maxLength="16" />
                      {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group col-md-6">
                        <label htmlFor="expiry" className="form-label">Expiry Date</label>
                        <input id="expiry" name="expiry" type="text" className={getInputClass('expiry')} value={values.expiry} onChange={handleChange} onBlur={handleBlur} placeholder="MM/YY" maxLength="5" />
                        {errors.expiry && <span className="error-text">{errors.expiry}</span>}
                      </div>

                      <div className="form-group col-md-6">
                        <label htmlFor="cvv" className="form-label">CVV</label>
                        <input id="cvv" name="cvv" type="text" className={getInputClass('cvv')} value={values.cvv} onChange={handleChange} onBlur={handleBlur} placeholder="123" maxLength="4" />
                        {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                      </div>
                    </div>
                  </>
                )}

                <div className="button-group mt-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveTab('shipping')}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary checkout-action-btn" onClick={goToReviewStep}>
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="form-section">
                <h3>Order Review</h3>

                {isRetryPending && (
                  <div className="alert alert-warning">
                    Payment is pending for order <strong>{retryPaymentContext.orderNumber}</strong>. Retry payment to confirm your order.
                  </div>
                )}

                <div className="review-items">
                  {cart.map((item) => (
                    <div key={item.id} className="review-item">
                      <div className="item-info">
                        <h5>{item.name}</h5>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <div className="item-price">INR {(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="price-summary mt-4">
                  <div className="price-row"><span>Subtotal:</span><span>INR {cartTotal.toFixed(2)}</span></div>
                  <div className="price-row"><span>Coupon Discount:</span><span>-INR {couponDiscountAmount.toFixed(2)}</span></div>
                  <div className="price-row"><span>Tax (10%):</span><span>INR {tax}</span></div>
                  <div className="price-row"><span>Shipping:</span><span>INR {shippingCharge.toFixed(2)}</span></div>
                  <div className="price-row total"><span>Total:</span><span>INR {finalTotal}</span></div>
                </div>

                <div className="promo-code-panel mt-3">
                  <label className="form-label">Promo Code</label>
                  <div className="input-group">
                    <input type="text" className="form-control" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="Enter promo code" disabled={Boolean(appliedCoupon)} />
                    {!appliedCoupon ? (
                      <button type="button" className="btn btn-outline-dark" onClick={handleApplyCoupon} disabled={couponLoading}>
                        {couponLoading ? 'Applying...' : 'Apply'}
                      </button>
                    ) : (
                      <button type="button" className="btn btn-outline-danger" onClick={handleRemoveCoupon}>Remove</button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <small className="text-success d-block mt-2">
                      {appliedCoupon.discountType === 'fixed'
                        ? `INR ${Number(appliedCoupon.discountValue || 0).toFixed(2)} off applied`
                        : `${Number(appliedCoupon.discountPercentage || 0).toFixed(0)}% off applied`}
                    </small>
                  )}
                </div>

                {values.wantsCustomization && (
                  <div className="review-customization mt-3">
                    <h4>Customization Request</h4>
                    <p>{values.customizationNote?.trim() ? values.customizationNote : 'Customer asked for customization and will confirm details later.'}</p>
                  </div>
                )}

                <div className="review-delivery mt-3">
                  <h4>Delivery Schedule</h4>
                  <p>{values.deliveryDate || 'Select a delivery date'} - {values.deliverySlot || 'morning'}</p>
                </div>

                <div className="button-group mt-4">
                  <button type="button" className="btn btn-secondary-action" onClick={() => setActiveTab('payment')}>
                    Back
                  </button>

                  {isRetryPending ? (
                    <button type="button" className="btn btn-place-order" onClick={handleRetryPayment} disabled={isSubmitting || isProcessingPayment}>
                      {isProcessingPayment ? 'Retrying Payment...' : 'Retry Payment'}
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-place-order" disabled={isSubmitting || isProcessingPayment}>
                      {isSubmitting || isProcessingPayment
                        ? 'Processing...'
                        : values.paymentMethod === 'cod'
                          ? `Place COD Order - INR ${finalTotal}`
                          : `Pay & Place Order - INR ${finalTotal}`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="checkout-sidebar">
          <div className="summary-card">
            <h4>Order Summary</h4>
            <div className="summary-items">
              {cart.map((item) => (
                <div key={item.id} className="summary-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>INR {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row"><span>Subtotal:</span><span>INR {cartTotal.toFixed(2)}</span></div>
            <div className="summary-row"><span>Coupon Discount:</span><span>-INR {couponDiscountAmount.toFixed(2)}</span></div>
            <div className="summary-row"><span>Tax:</span><span>INR {tax}</span></div>
            <div className="summary-row"><span>Shipping:</span><span>INR {shippingCharge.toFixed(2)}</span></div>
            <div className="summary-total"><span>Total:</span><span>INR {finalTotal}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CheckoutPage;
