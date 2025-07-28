const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createBloodRequestController,
  getRequestsController,
  updateRequestStatusController,
  createDonationAppointmentController,
  getRequestAnalyticsController,
} = require("../controllers/requestController");

const router = express.Router();

//routes
//CREATE BLOOD REQUEST || POST
router.post("/create-request", authMiddleware, createBloodRequestController);

//GET ALL REQUESTS || GET
router.get("/get-requests", authMiddleware, getRequestsController);

//UPDATE REQUEST STATUS || PUT
router.put("/update-status/:id", authMiddleware, updateRequestStatusController);

//CREATE DONATION APPOINTMENT || POST
router.post("/create-appointment", authMiddleware, createDonationAppointmentController);

//GET REQUEST ANALYTICS || GET
router.get("/analytics", authMiddleware, getRequestAnalyticsController);

module.exports = router;
