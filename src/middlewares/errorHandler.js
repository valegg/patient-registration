const multer = require("multer");
const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File size exceeds the 5 MB limit"
        : "Invalid file type. Accepted: jpeg, png, webp, pdf";
    return res.status(422).json({ errors: [message] });
  }

  logger.error(err.message);
  return res.status(500).json({ errors: ["Internal server error"] });
}

module.exports = errorHandler;
