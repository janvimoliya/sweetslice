let razorpayScriptPromise;

const loadRazorpayScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in browser environments'));
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Unable to load Razorpay Checkout SDK'));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

export const initiateRazorpayPayment = async ({
  apiBaseUrl,
  orderId,
  orderNumber,
  totalAmount,
  userEmail,
  userName,
  callback,
}) => {
  try {
    await loadRazorpayScript();

    const initiateResponse = await fetch(`${apiBaseUrl}/api/orders/${orderId}/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const initiateResult = await initiateResponse.json().catch(() => ({}));
    if (!initiateResponse.ok) {
      throw new Error(initiateResult.message || 'Unable to initiate payment');
    }

    const paymentData = initiateResult?.data || {};
    const key = String(paymentData.keyId || '').trim();
    const razorpayOrderId = String(paymentData.razorpayOrderId || '').trim();
    const amount = Number(paymentData.amount || 0);
    const currency = String(paymentData.currency || 'INR').trim() || 'INR';

    if (!key || !razorpayOrderId || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid Razorpay payment initiation response');
    }

    const razorpayOptions = {
      key,
      amount,
      currency,
      name: 'SweetSlice',
      description: `Payment for order ${String(orderNumber || '') || String(orderId || '')}`,
      order_id: razorpayOrderId,
      prefill: {
        name: String(userName || '').trim(),
        email: String(userEmail || '').trim(),
      },
      notes: {
        appOrderId: String(orderId || '').trim(),
        appOrderNumber: String(orderNumber || '').trim(),
      },
      handler: (response) => {
        if (!callback) return;

        callback({
          success: true,
          razorpayPaymentId: String(response?.razorpay_payment_id || ''),
          razorpayOrderId: String(response?.razorpay_order_id || razorpayOrderId),
          razorpaySignature: String(response?.razorpay_signature || ''),
          userEmail,
          userName,
          totalAmount,
          orderId,
          orderNumber,
        });
      },
      modal: {
        ondismiss: () => {
          if (!callback) return;

          callback({
            success: false,
            error: 'Payment popup closed before completing payment',
          });
        },
      },
      theme: {
        color: '#6f4a33',
      },
    };

    const razorpayInstance = new window.Razorpay(razorpayOptions);

    razorpayInstance.on('payment.failed', (response) => {
      if (!callback) return;

      callback({
        success: false,
        error: String(response?.error?.description || response?.error?.reason || 'Payment failed at Razorpay'),
      });
    });

    razorpayInstance.open();
  } catch (error) {
    if (callback) {
      callback({
        success: false,
        error: error.message || 'Failed to initiate Razorpay payment',
      });
    }
  }
};

export const verifyRazorpaySignature = async ({
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
  apiBaseUrl,
  orderId,
}) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders/${orderId}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentStatus: 'completed',
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        transactionId: razorpayPaymentId,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Payment verification failed');
    }

    return {
      success: true,
      transactionId: razorpayPaymentId,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to verify payment',
    };
  }
};
