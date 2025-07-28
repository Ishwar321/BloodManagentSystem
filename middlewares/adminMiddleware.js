const adminMiddleware = async (req, res, next) => {
  try {
    const userModel = require("../models/userModel");
    const user = await userModel.findById(req.body.userId);
    
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "User not found",
      });
    }
    
    if (user.role !== "admin") {
      return res.status(403).send({
        success: false,
        message: "Access denied. Admin only.",
      });
    }
    
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      message: "Auth Failed",
      error,
    });
  }
};

module.exports = adminMiddleware;
