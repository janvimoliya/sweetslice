import express from "express";
import { body } from "express-validator";
import { createContact, getAllContacts, getSingleContact, replyContact, deleteContact } from "../controllers/Contact.controller.js";

const router = express.Router();

// POST route with validation
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("mobile").notEmpty().withMessage("Mobile is required"),
    body("subject").notEmpty().withMessage("Subject is required"),
    body("message").notEmpty().withMessage("Message is required"),
  ],
  createContact
);

router.get("/", getAllContacts);
router.get("/:id", getSingleContact);
router.put("/:id/reply", replyContact);
router.delete("/:id", deleteContact);

export default router;