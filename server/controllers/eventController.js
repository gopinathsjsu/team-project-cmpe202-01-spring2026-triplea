// Controller for handling event request logic.

// simple event controller endpoint test
const getAllEvents = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Events endpoint is working",
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  getAllEvents,
};