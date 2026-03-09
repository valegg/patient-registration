require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || "patient_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  },

  smtp: {
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT, 10) || 2525,
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.MAIL_FROM || "noreply@patientapp.com",
  },

  uploadDir: process.env.UPLOAD_DIR || "uploads",

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },

  apiKey: process.env.API_KEY || "demo-api-key",
};
