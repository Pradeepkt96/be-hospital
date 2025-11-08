const Joi = require("joi");

// Register validation schema
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(5).required().messages({
    "string.min": "Password must be at least 5 characters long",
    "any.required": "Password is required",
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name cannot exceed 100 characters",
    "any.required": "Full name is required",
  }),
  role: Joi.number().integer().required().messages({
    "number.base": "Role must be a number",
    "any.required": "Role is required",
  }),
  user_details: Joi.object({
    age: Joi.number().integer().min(1).max(150).required().messages({
      "number.base": "Age must be a number",
      "number.min": "Age must be at least 1",
      "number.max": "Age cannot exceed 150",
      "any.required": "Age is required",
    }),
    gender: Joi.string().valid("Male", "Female", "Other").required().messages({
      "any.only": "Gender must be Male, Female, or Other",
      "any.required": "Gender is required",
    }),
    height_cm: Joi.number().min(50).max(300).required().messages({
      "number.base": "Height must be a number",
      "number.min": "Height must be at least 50 cm",
      "number.max": "Height cannot exceed 300 cm",
      "any.required": "Height is required",
    }),
    weight_kg: Joi.number().min(10).max(500).required().messages({
      "number.base": "Weight must be a number",
      "number.min": "Weight must be at least 10 kg",
      "number.max": "Weight cannot exceed 500 kg",
      "any.required": "Weight is required",
    }),
    phone: Joi.string().min(10).max(20).required().messages({
      "string.min": "Phone number must be at least 10 characters",
      "string.max": "Phone number cannot exceed 20 characters",
      "any.required": "Phone number is required",
    }),
    address: Joi.string().min(5).max(200).required().messages({
      "string.min": "Address must be at least 5 characters",
      "string.max": "Address cannot exceed 200 characters",
      "any.required": "Address is required",
    }),
  }).required(),
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};

