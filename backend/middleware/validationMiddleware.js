export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateMobile = (mobile) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(mobile.replace(/\D/g, ''));
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validationMiddleware = (req, res, next) => {
  const { email, mobile, password } = req.body;

  if (email && !validateEmail(email)) {
    return res.status(400).json({
      message: 'Invalid email format',
    });
  }

  if (mobile && !validateMobile(mobile)) {
    return res.status(400).json({
      message: 'Invalid mobile number',
    });
  }

  if (password && !validatePassword(password)) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters',
    });
  }

  next();
};
