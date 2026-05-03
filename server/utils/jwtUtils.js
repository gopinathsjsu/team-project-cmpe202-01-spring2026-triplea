const jwt = require("jsonwebtoken");

// Create a signed JWT for authenticated users.
function generateToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== "string") {
    const err = new Error("JWT_SECRET is not set in the server environment");
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

// Verify and decode a JWT from incoming requests.
function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== "string") {
    const err = new Error("JWT_SECRET is not set in the server environment");
    err.statusCode = 500;
    throw err;
  }
  return jwt.verify(token, secret);
}

module.exports = {
  generateToken,
  verifyToken,
};
