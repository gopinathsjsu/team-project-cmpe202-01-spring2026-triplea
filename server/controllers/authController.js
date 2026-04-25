// Controller for handling authentication request logic.

// simple auth controller test 
const testAuth = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth route is working"
  });
};

module.exports = {
  testAuth,
};