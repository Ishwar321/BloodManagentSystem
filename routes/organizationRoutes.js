const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getOrganizationDashboardController,
  createCampaignController,
  getCampaignsController,
  createEventController,
  getEventsController,
  getDonorNetworkController,
  getPartnershipsController,
  createPartnershipController,
  updateCampaignController,
  getHospitalPartnersController,
  createHospitalPartnershipController,
  getAvailableHospitalsController,
  addDonorController,
  exportDonorsController
} = require("../controllers/organizationController");

const { createSampleDataController } = require("../controllers/sampleDataController");

//router object
const router = express.Router();

// ROUTES

// GET ORGANIZATION DASHBOARD DATA || GET
router.get("/dashboard", authMiddleware, getOrganizationDashboardController);

// CREATE CAMPAIGN || POST
router.post("/create-campaign", authMiddleware, createCampaignController);

// GET CAMPAIGNS || GET
router.get("/campaigns", authMiddleware, getCampaignsController);

// UPDATE CAMPAIGN || PUT
router.put("/campaigns/:campaignId", authMiddleware, updateCampaignController);

// CREATE EVENT || POST
router.post("/create-event", authMiddleware, createEventController);

// GET EVENTS || GET
router.get("/events", authMiddleware, getEventsController);

// GET DONOR NETWORK || GET
router.get("/donor-network", authMiddleware, getDonorNetworkController);

// CREATE PARTNERSHIP || POST
router.post("/create-partnership", authMiddleware, createPartnershipController);

// GET PARTNERSHIPS || GET
router.get("/partnerships", authMiddleware, getPartnershipsController);

// HOSPITAL PARTNERS ROUTES
// GET AVAILABLE HOSPITALS || GET
router.get("/available-hospitals", authMiddleware, getAvailableHospitalsController);

// GET HOSPITAL PARTNERS || GET
router.get("/hospital-partners", authMiddleware, getHospitalPartnersController);

// CREATE HOSPITAL PARTNERSHIP || POST
router.post("/create-hospital-partnership", authMiddleware, createHospitalPartnershipController);

// DONOR MANAGEMENT ROUTES
// ADD DONOR || POST
router.post("/add-donor", authMiddleware, addDonorController);

// EXPORT DONORS DATA || GET
router.get("/export-donors", authMiddleware, exportDonorsController);

// CREATE SAMPLE DATA FOR TESTING || POST
router.post("/create-sample-data", authMiddleware, createSampleDataController);

module.exports = router;
