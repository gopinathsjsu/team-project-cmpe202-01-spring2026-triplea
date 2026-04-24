const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { registerUser, loginUser, getProfile } = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
