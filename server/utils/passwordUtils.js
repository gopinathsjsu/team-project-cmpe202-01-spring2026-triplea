const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

// Hash a plain text password before storing it.
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Compare login password input against a stored hash.
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
};
