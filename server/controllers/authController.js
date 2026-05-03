const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const { generateToken } = require("../utils/jwtUtils");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const pool = require("../config/db");
const { isBasicEmailFormat } = require("../utils/validation");

/** Roles users may choose when registering (admin is not self-service). */
const selfRegisterRoles = ["attendee", "organizer"];

async function registerUser(req, res, next) {
  try {
    const { full_name, email, password, role } = req.body;

    const fullNameTrimmed = typeof full_name === "string" ? full_name.trim() : "";
    if (!fullNameTrimmed) {
      return errorResponse(res, 400, "full_name is required");
    }

    const emailTrimmed = typeof email === "string" ? email.trim() : "";
    if (!emailTrimmed) {
      return errorResponse(res, 400, "email is required");
    }
    if (!isBasicEmailFormat(emailTrimmed)) {
      return errorResponse(res, 400, "Invalid email format");
    }

    if (typeof password !== "string" || password.length < 6) {
      return errorResponse(res, 400, "password must be at least 6 characters");
    }

    const normalizedEmail = emailTrimmed.toLowerCase();
    const userRole = role || "attendee";

    if (!selfRegisterRoles.includes(userRole)) {
      return errorResponse(res, 400, "Invalid role value");
    }

    const existingUserResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUserResult.rows.length > 0) {
      return errorResponse(res, 409, "Email is already registered");
    }

    const password_hash = await hashPassword(password);
    const createdUserResult = await pool.query(
      `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, role
      `,
      [fullNameTrimmed, normalizedEmail, password_hash, userRole]
    );

    const newUser = createdUserResult.rows[0];

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
  } catch (error) {
    return next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "email and password are required");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      normalizedEmail,
    ]);

    if (userResult.rows.length === 0) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const user = userResult.rows[0];


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
  } catch (error) {
    return next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    return successResponse(res, { user: req.user }, "Profile fetched successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registerUser,
  loginUser,
  getProfile,
};
