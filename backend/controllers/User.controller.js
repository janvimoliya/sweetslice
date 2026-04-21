import User from '../model/User.js';
import Register from '../model/Register.js';
import bcrypt from 'bcryptjs';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import process from 'node:process';
import { sendVerificationEmail } from '../config/mailer.js';

const buildRegisterPayloadFromUser = (userDoc) => ({
  fullname: userDoc.fullName,
  email: String(userDoc.email || '').trim().toLowerCase(),
  mobile: userDoc.mobile,
  gender: userDoc.gender || 'other',
  address: userDoc.address || 'N/A',
  terms: true,
  profile_picture: userDoc.profilePicture || null,
  role: 'User',
  Status: 'Active',
});

const syncRegisterCollectionFromUser = async (userDoc, plainPassword = null) => {
  const payload = buildRegisterPayloadFromUser(userDoc);
  const existingRegister = await Register.findOne({ email: payload.email }).select('+password');

  if (existingRegister) {
    Object.assign(existingRegister, payload);
    if (plainPassword) {
      existingRegister.password = plainPassword;
      existingRegister.confirmPassword = null;
    }
    await existingRegister.save();
    return existingRegister;
  }

  const registerDoc = new Register({
    ...payload,
    password: plainPassword || 'TempPass@123',
    confirmPassword: null,
  });
  await registerDoc.save();
  return registerDoc;
};

const resetTokenValidityMs = 15 * 60 * 1000;

const generatePasswordResetToken = () => {
  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

  return {
    plainToken,
    hashedToken,
    expiresAt: new Date(Date.now() + resetTokenValidityMs),
  };
};

// Register User
export const registerUser = async (req, res) => {
  try {
    const { email, fullName, mobile, password, confirmPassword, gender, address, city, state, zipCode } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    console.log('[registerUser] Request received:', { email, fullName, mobile, gender });
    console.log('[registerUser] Password length:', password?.length);
    console.log('[registerUser] File uploaded:', req.file ? req.file.filename : 'No file');

    // Validate required fields
    if (!normalizedEmail || !fullName || !mobile || !password) {
      return res.status(400).json({ message: 'Missing required fields: email, fullName, mobile, password' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email: normalizedEmail,
      fullName,
      mobile,
      password: hashedPassword,
      gender: gender?.toLowerCase(),
      address,
      city,
      state,
      zipCode,
      profilePicture: req.file ? req.file.filename : null,
    });

    await newUser.save();
    await syncRegisterCollectionFromUser(newUser, password);
    console.log('[registerUser] User saved successfully:', newUser._id);

    // Generate token first
    const token = Buffer.from(`${newUser._id}:${Date.now()}`).toString('base64');

    let emailSent = false;
    let emailError = null;

    try {
      const subject = 'Welcome to SweetSlice';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const loginLink = `${clientUrl}/login`;
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:auto;">
          <h2 style="margin-bottom:8px;">Welcome, ${newUser.fullName}!</h2>
          <p style="margin-top:0;">Your SweetSlice account has been created successfully.</p>
          <p>You can now log in and start exploring cakes, offers, and orders.</p>
          <p>
            <a href="${loginLink}" style="display:inline-block;padding:10px 18px;background:#7b4a34;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;">
              Login to SweetSlice
            </a>
          </p>
          <p style="font-size:12px;color:#6b7280;">If the button does not work, open this link: <a href="${loginLink}">${loginLink}</a></p>
          <p style="font-size:12px;color:#6b7280;">If you did not create this account, please contact support immediately.</p>
        </div>
      `;

      await sendVerificationEmail({
        toEmail: newUser.email,
        subject,
        html,
      });
      emailSent = true;
      console.log('[registerUser] Verification email sent successfully');
    } catch (mailError) {
      emailError = mailError.message;
      console.error('[registerUser] Email sending failed:', mailError.message);
    }

    // Always return success with user data (email status is informational)
    const responseMessage = emailSent
      ? 'User registered successfully. Welcome email sent.'
      : 'User registered but welcome email could not be sent. You can still log in.';

    res.status(201).json({
      message: responseMessage,
      emailSent,
      data: {
        userId: newUser._id,
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        token: token,
      },
      ...(emailError && { emailError }),
    });
  } catch (error) {
    console.error('[registerUser] Error:', error.message);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get User by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User fetched', data: user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const existingUser = await User.findById(id).select('-password');

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { fullName, email, mobile, gender, address, city, state, zipCode, profilePicture } = req.body;
    const normalizedEmail = email !== undefined ? String(email).trim().toLowerCase() : existingUser.email;
    const normalizedGender = gender !== undefined ? String(gender).trim().toLowerCase() : existingUser.gender;

    if (normalizedEmail && normalizedEmail !== String(existingUser.email || '').toLowerCase()) {
      const duplicateEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: id } }).select('_id');
      if (duplicateEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    const allowedGenders = ['male', 'female', 'other'];
    if (normalizedGender && !allowedGenders.includes(normalizedGender)) {
      return res.status(400).json({ message: 'Gender must be male, female, or other' });
    }

    const updateData = {
      fullName: fullName !== undefined ? String(fullName).trim() : existingUser.fullName,
      email: normalizedEmail,
      mobile: mobile !== undefined ? String(mobile).replace(/\D/g, '').trim() : existingUser.mobile,
      gender: normalizedGender || undefined,
      address: address !== undefined ? String(address).trim() : existingUser.address,
      city: city !== undefined ? String(city).trim() : existingUser.city,
      state: state !== undefined ? String(state).trim() : existingUser.state,
      zipCode: zipCode !== undefined ? String(zipCode).trim() : existingUser.zipCode,
    };

    if (req.file?.filename) {
      updateData.profilePicture = req.file.filename;
    } else if (profilePicture) {
      updateData.profilePicture = profilePicture;
    } else {
      updateData.profilePicture = existingUser.profilePicture;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      context: 'query',
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await syncRegisterCollectionFromUser(updatedUser);

    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed while updating profile',
        error: Object.values(error.errors || {})
          .map((item) => item.message)
          .join(', '),
      });
    }

    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Register.deleteOne({ email: String(deletedUser.email || '').trim().toLowerCase() });

    res.status(200).json({
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a simple token (base64 encoded user ID + timestamp)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');

    res.status(200).json({
      message: 'Login successful',
      data: {
        userId: user._id,
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        mobile: user.mobile,
        token: token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken +resetPasswordExpiresAt');

    if (!user) {
      return res.status(200).json({
        message: 'If this email is registered, a password reset link has been sent.',
      });
    }

    const { plainToken, hashedToken, expiresAt } = generatePasswordResetToken();
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${plainToken}`;

    await sendVerificationEmail({
      toEmail: user.email,
      subject: 'SweetSlice password reset request',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:auto;">
          <h2 style="margin-bottom:8px;">Reset your password</h2>
          <p style="margin-top:0;">We received a request to reset your SweetSlice account password.</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:10px 18px;background:#e31c23;color:#ffffff;text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p>If the button does not work, open this link:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p style="font-size:12px;color:#6b7280;">This link expires in 15 minutes. If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: 'If this email is registered, a password reset link has been sent.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to process forgot password request', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body || {};

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match' });
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select('+password +resetPasswordToken +resetPasswordExpiresAt');

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await user.save({ validateBeforeSave: false });

    await syncRegisterCollectionFromUser(user, password);

    return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reset password', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Current password, new password and confirm password are required' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    const user = await User.findById(userId).select('+password +resetPasswordToken +resetPasswordExpiresAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(String(currentPassword), user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await user.save({ validateBeforeSave: false });

    await syncRegisterCollectionFromUser(user, String(newPassword));

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update password', error: error.message });
  }
};
