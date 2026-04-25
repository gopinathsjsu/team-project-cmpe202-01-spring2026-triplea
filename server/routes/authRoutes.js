// Express routes for authentication-related endpoints.

// simple auth route test
const express = require("express");
const router = express.Router();
const { testAuth } = require("../controllers/authController");

router.get("/test", testAuth);

module.exports = router;