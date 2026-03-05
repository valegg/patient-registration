const config = require("../config");

/**
 * Simple API key authentication for read endpoints.
 * Pass the key via the `x-api-key` header.
 * The default development key is "demo-api-key" (see .env.example).
 */
function apiKeyAuth(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== config.apiKey) {
    return res.status(401).json({
      errors: ['Missing or invalid API key. Add header: x-api-key: demo-api-key'],
    });
  }
  next();
}

module.exports = apiKeyAuth;
