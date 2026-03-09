const rateLimit = require("express-rate-limit");

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errors: ["Too many registration attempts. Please try again later."] },
});

module.exports = { registrationLimiter };
