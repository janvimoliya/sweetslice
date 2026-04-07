import { Router } from "express";
import { check } from "express-validator";
import {
  deleteRegistration,
  getRegistrations,
  register,
  updateRegistration,
  login,
  verifyEmail,
} from "../controllers/Register.controller.js";
import { validateFileUpload } from "../middleware/filevalidator.js";
import { uploadProfilePic } from "../config/multer.js";


const router = Router();


router.get("/register", getRegistrations);
router.put(
  "/register/:id",
  uploadProfilePic.single("profile_picture"),
  [
    check("fullname").notEmpty().withMessage("Full name is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("mobile").notEmpty().withMessage("Mobile number is required"),
    check("gender").notEmpty().withMessage("Gender is required"),
    check("address").notEmpty().withMessage("Address is required"),
    check("terms")
      .isBoolean()
      .toBoolean()
      .withMessage("Terms must be accepted"),
    ...validateFileUpload(
      "profile_picture",
      ["image/jpeg", "image/png", "image/webp"],
      2,
    ),
  ],
  updateRegistration,
);
router.delete("/register/:id", deleteRegistration);


router.post(
  "/register",
  uploadProfilePic.single("profile_picture"),
  [
    check("fullname").notEmpty().withMessage("Full name is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("mobile").notEmpty().withMessage("Mobile number is required"),
    check("gender").notEmpty().withMessage("Gender is required"),
    check("address").notEmpty().withMessage("Address is required"),
    check("password")
      .isLength({ min: 8, max: 25 })
      .withMessage(
        "Password must be at least 8 characters and at most 25 characters",
      )
      .matches(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}/,
      )
      .withMessage(
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
      ),
    check("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      })
      .withMessage("Confirm password must match password"),


    check("terms")
      .isBoolean()
      .toBoolean()
      .withMessage("Terms must be accepted"),
    ...validateFileUpload(
      "profile_picture",
      ["image/jpeg", "image/png", "image/webp"],
      2,
    ),
  ],
  register,
);


router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  login,
);

router.get("/verify-email/:token", verifyEmail);


export default router;
