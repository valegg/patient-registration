const Joi = require("joi");

const registerPatientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must not exceed 200 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().max(255).required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  phone: Joi.string()
    .pattern(/^[\d\s\-\(\)\+]{7,20}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be between 7 and 20 characters and contain only digits and allowed symbols",
      "any.required": "Phone number is required",
    }),
});

function validateRegisterPatient(data) {
  const { error, value } = registerPatientSchema.validate(data, { abortEarly: false });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return { valid: false, errors: messages };
  }

  return { valid: true, value };
}

module.exports = { validateRegisterPatient };
