const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const { generateToken } = require("../utils/jwtUtils");
const { successResponse, errorResponse } = require("../utils/responseHandler");

const users = [];
let nextUserId = 1;
const allowedRoles = ["attendee", "organizer", "admin"];

async function registerUser(req, res) {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password) {
    return errorResponse(res, 400, "full_name, email, and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const userRole = role || "attendee";

  if (!allowedRoles.includes(userRole)) {
    return errorResponse(res, 400, "Invalid role value");
  }

  const existingUser = users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    return errorResponse(res, 409, "Email is already registered");
  }

  const password_hash = await hashPassword(password);

  const newUser = {
    id: nextUserId++,
    full_name: String(full_name).trim(),
    email: normalizedEmail,
    password_hash,
    role: userRole,
  };

  users.push(newUser);

  const token = generateToken({
    userId: newUser.id,
    role: newUser.role,
  });

  const userResponse = {
    id: newUser.id,
    full_name: newUser.full_name,
    email: newUser.email,
    role: newUser.role,
  };

  return successResponse(
    res,
    { user: userResponse, token },
    "User registered successfully",
    201
  );
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 400, "email and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = users.find((existingUser) => existingUser.email === normalizedEmail);

  if (!user) {
    return errorResponse(res, 401, "Invalid email or password");
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    return errorResponse(res, 401, "Invalid email or password");
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  const userResponse = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };

  return successResponse(res, { user: userResponse, token }, "Login successful");
}

module.exports = {
  registerUser,
  loginUser,
};
