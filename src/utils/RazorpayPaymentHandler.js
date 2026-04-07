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
    const initiateResponse = await fetch(`${apiBaseUrl}/api/orders/${orderId}/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const initiateResult = await initiateResponse.json().catch(() => ({}));
    if (!initiateResponse.ok) {
      throw new Error(initiateResult.message || 'Unable to initiate payment');
    }

    const paymentData = initiateResult?.data || {};
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    if (callback) {
      window.setTimeout(() => {
        callback({
          success: true,
          razorpayPaymentId: transactionId,
          razorpayOrderId: String(paymentData.paymentSessionId || ''),
          razorpaySignature: String(paymentData.signedToken || ''),
          paymentSessionId: String(paymentData.paymentSessionId || ''),
          signedToken: String(paymentData.signedToken || ''),
          userEmail,
          userName,
          totalAmount,
          orderId,
          orderNumber,
        });
      }, 800);
    }
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
        paymentSessionId: razorpayOrderId,
        signedToken: razorpaySignature,
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
