const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  createDonationCampController,
  getCampsController,
  registerForCampController,
  approveCampController,
  updateCampResultsController,
  getCampAnalyticsController,
} = require("../controllers/donationCampController");

const router = express.Router();

//routes
//CREATE DONATION CAMP || POST
router.post("/create-camp", authMiddleware, createDonationCampController);

//GET ALL CAMPS || GET
router.get("/get-camps", authMiddleware, getCampsController);

//REGISTER FOR CAMP || POST
router.post("/register/:campId", authMiddleware, registerForCampController);

//APPROVE CAMP (Admin only) || PUT
router.put("/approve/:campId", authMiddleware, adminMiddleware, approveCampController);

//UPDATE CAMP RESULTS || PUT
router.put("/update-results/:campId", authMiddleware, updateCampResultsController);

//GET CAMP ANALYTICS || GET
router.get("/analytics", authMiddleware, getCampAnalyticsController);

module.exports = router;
