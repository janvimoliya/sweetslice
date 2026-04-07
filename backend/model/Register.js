import mongoose from "mongoose";
import bcrypt from "bcrypt";
const registerSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    default: null,
  },
  terms: {
    type: Boolean,
    required: true,
  },
  profile_picture: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["User", "Admin"],
    default: "User",
  },
  Status: {
    type: String,
    enum: ["Active", "Inactive", "Deleted"],
    default: "Active",
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  emailVerificationTokenExpiresAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


registerSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }


  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


export default mongoose.model("Register", registerSchema);
