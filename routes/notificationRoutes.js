const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  createNotificationController,
  getUserNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  deleteNotificationController,
  sendDonationRemindersController,
} = require("../controllers/notificationController");

const router = express.Router();

//routes
//CREATE NOTIFICATION (Admin only) || POST
router.post("/create", authMiddleware, adminMiddleware, createNotificationController);

//GET USER NOTIFICATIONS || GET
router.get("/get-notifications", authMiddleware, getUserNotificationsController);

//MARK NOTIFICATION AS READ || PUT
router.put("/mark-read/:notificationId", authMiddleware, markNotificationReadController);

//MARK ALL NOTIFICATIONS AS READ || PUT
router.put("/mark-all-read", authMiddleware, markAllNotificationsReadController);

//DELETE NOTIFICATION (Admin only) || DELETE
router.delete("/delete/:notificationId", authMiddleware, adminMiddleware, deleteNotificationController);

//SEND DONATION REMINDERS (Admin only) || POST
router.post("/send-reminders", authMiddleware, adminMiddleware, sendDonationRemindersController);

module.exports = router;
