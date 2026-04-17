import Register from "../model/Register.js";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import fs from "node:fs";
import process from "node:process";
import { sendVerificationEmail } from "../config/mailer.js";

const removeUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};


export const getRegistrations = async (req, res) => {
  try {
    const users = await Register.find()
      .select(
        "fullname email mobile gender address profile_picture terms createdAt",
      )
      .sort({ createdAt: -1 });


    res.status(200).json({ data: users });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching registrations" });
  }
};


export const updateRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array(), message: "Validation failed" });
  }
  try {
    const { id } = req.params;
    const { fullname, email, mobile, gender, address, terms } = req.body;


    const existingUser = await Register.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "Registration not found" });
    }


    if (email && email !== existingUser.email) {
      const duplicateEmail = await Register.findOne({ email });
      if (duplicateEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }


    const updateData = {
      fullname,
      email,
      mobile,
      gender,
      address,
      terms: typeof terms === "string" ? terms === "true" : Boolean(terms),
      updatedAt: new Date(),
    };


    if (req.file) {
      updateData.profile_picture = req.file.filename;
    }


    const updatedUser = await Register.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select(
      "fullname email mobile gender address profile_picture terms createdAt",
    );


    return res.status(200).json({
      message: "Registration updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return res
      .status(500)
      .json({ message: "Server error while updating registration" });
  }
};


export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await Register.findByIdAndDelete(id);


    if (!deletedUser) {
      return res.status(404).json({ message: "Registration not found" });
    }


    return res
      .status(200)
      .json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return res
      .status(500)
      .json({ message: "Server error while deleting registration" });
  }
};


export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    removeUploadedFile(req.file);
    return res
      .status(400)
      .json({ errors: errors.array(), msg: "Validation failed" });
  }


  try {
    const {
      fullname,
      email,
      mobile,
      gender,
      address,
      password,
      confirmPassword,
      terms,
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    const existingUser = await Register.findOne({ email: normalizedEmail });
    if (existingUser) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: "Email already registered" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const profile_picture = req.file
      ? `/uploads/profilePics/${req.file.filename}`
      : null;

    const newUser = new Register({
      fullname: String(fullname || "").trim(),
      email: normalizedEmail,
      mobile: String(mobile || "").trim(),
      gender: String(gender || "").toLowerCase(),
      address,
      password,
      confirmPassword,
      terms: terms === true || terms === "true",
      profile_picture,
      Status: "Inactive",
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await newUser.save();

    const verifyLink = `${process.env.SERVER_URL || "http://localhost:5000"}/api/verify-email/${verificationToken}`;

    let emailSent = false;
    let emailError = null;

    try {
      const subject = "Verify your SweetSlice account";
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:auto;">
          <h2 style="margin-bottom:8px;">Welcome, ${newUser.fullname}!</h2>
          <p style="margin-top:0;">Thanks for registering. Please verify your email to activate your account.</p>
          <p>
            <a href="${verifyLink}" style="display:inline-block;padding:10px 18px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;">
              Verify Email
            </a>
          </p>
          <p>If the button does not work, open this link:</p>
          <p><a href="${verifyLink}">${verifyLink}</a></p>
          <p style="font-size:12px;color:#6b7280;">This link will expire in 24 hours.</p>
        </div>
      `;

      await sendVerificationEmail({
        toEmail: newUser.email,
        subject,
        html,
      });
      emailSent = true;
    } catch (mailError) {
      emailError = mailError.message;
      console.error('[Register] Email sending failed:', mailError.message);
      // Don't delete user on email failure - allow signup to succeed anyway
    }

    res.status(201).json({
      success: true,
      message:
        emailSent
          ? "Registration successful. Please check your email to verify your account."
          : "Registration successful, but verification email could not be sent right now. You can still log in.",
      emailSent,
      user: {
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        mobile: newUser.mobile,
        gender: newUser.gender,
        profile_picture: newUser.profile_picture,
        Status: newUser.Status,
        createdAt: newUser.createdAt,
      },
      ...(emailError && { emailError }),
    });
  } catch (error) {
    removeUploadedFile(req.file);
    console.error("Error during registration:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration",
      error: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const successUrl =
      process.env.VERIFICATION_SUCCESS_URL || `${clientUrl}/email-verification`;
    const failureUrl =
      process.env.VERIFICATION_FAILURE_URL || `${clientUrl}/email-verification`;

    if (!token) {
      return res.redirect(
        `${failureUrl}?status=error&message=${encodeURIComponent("Invalid verification link.")}`,
      );
    }

    const user = await Register.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.redirect(
        `${failureUrl}?status=error&message=${encodeURIComponent("Verification link is invalid or has expired.")}`,
      );
    }

    user.Status = "Active";
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    await user.save();

    return res.redirect(
      `${successUrl}?status=success&message=${encodeURIComponent("Email verified successfully. Your account is now Active.")}`,
    );
  } catch {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const failureUrl =
      process.env.VERIFICATION_FAILURE_URL || `${clientUrl}/email-verification`;
    return res.redirect(
      `${failureUrl}?status=error&message=${encodeURIComponent("Unable to verify email right now. Please try again later.")}`,
    );
  }
};


export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array(), message: "Validation failed" });
  }


  try {
    const { email, password } = req.body;


    const user = await Register.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }


    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }


    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
