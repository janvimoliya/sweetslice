import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  reply: {
    type: String,
  },
  reply_date: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["Pending", "Replied"],
    default: "Pending",
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

contactSchema.pre("save", function () {
  this.updated_at = Date.now();
});

export default mongoose.model("Contact", contactSchema);
