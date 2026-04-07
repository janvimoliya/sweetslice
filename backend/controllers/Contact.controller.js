import Contact from "../model/Contact.js";
import { validationResult } from "express-validator";

// ===============================
// Create Contact (User side)
// ===============================
export const createContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
      message: "Validation failed",
    });
  }

  try {
    const { name, mobile, email, subject, message } = req.body;

    const contact = await Contact.create({
      name,
      mobile,
      email,
      subject,
      message,
      status: "Pending",
      created_at: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: "Contact submitted successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating contact",
    });
  }
};

// ===============================
// Get All Contacts (Admin side)
// ===============================
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching contacts",
    });
  }
};

// ===============================
// Get Single Contact
// ===============================
export const getSingleContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching contact",
    });
  }
};

// ===============================
// Reply to Contact (Admin side)
// ===============================
export const replyContact = async (req, res) => {
  try {
    const { reply } = req.body;

    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        reply,
        reply_date: Date.now(),
        status: "Replied",
        updated_at: Date.now(),
      },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: updatedContact,
    });
  } catch (error) {
    console.error("Error replying to contact:", error);
    res.status(500).json({
      success: false,
      message: "Server error while replying to contact",
    });
  }
};

// ===============================
// Delete Contact (Optional)
// ===============================
export const deleteContact = async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);

    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting contact",
    });
  }
};
