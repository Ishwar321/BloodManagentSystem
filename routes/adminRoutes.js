const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getDonarsListController,
  getHospitalListController,
  getOrgListController,
  deleteDonarController,
  getAdminDashboardController,
} = require("../controllers/adminController");

const router = express.Router();

//routes
//GET || DONAR LIST
router.get("/donar-list", authMiddleware, adminMiddleware, getDonarsListController);

//GET || HOSPITAL LIST
router.get("/hospital-list", authMiddleware, adminMiddleware, getHospitalListController);

//GET || ORGANIZATION LIST
router.get("/org-list", authMiddleware, adminMiddleware, getOrgListController);

//DELETE || DELETE DONAR
router.delete("/delete-donar/:id", authMiddleware, adminMiddleware, deleteDonarController);

//GET || ADMIN DASHBOARD ANALYTICS
router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboardController);

module.exports = router;
