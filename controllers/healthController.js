const mongoose = require("mongoose");
const userModel = require("../models/userModel");
const inventoryModel = require("../models/inventoryModel");
const campaignModel = require("../models/campaignModel");
const eventModel = require("../models/eventModel");
const donationCampModel = require("../models/donationCampModel");

// HEALTH CHECK CONTROLLER
const healthCheckController = async (req, res) => {
  try {
    const health = {
      status: "OK",
      timestamp: new Date().toISOString(),
      database: "Connected",
      services: {},
      statistics: {}
    };

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      health.database = "Disconnected";
      health.status = "ERROR";
    }

    // Get basic statistics
    try {
      health.statistics = {
        totalUsers: await userModel.countDocuments(),
        totalDonors: await userModel.countDocuments({ role: "donar" }),
        totalHospitals: await userModel.countDocuments({ role: "hospital" }),
        totalOrganisations: await userModel.countDocuments({ role: "organisation" }),
        totalInventoryRecords: await inventoryModel.countDocuments(),
        totalCampaigns: await campaignModel.countDocuments(),
        totalEvents: await eventModel.countDocuments(),
        totalCamps: await donationCampModel.countDocuments()
      };
      health.services.userService = "OK";
      health.services.inventoryService = "OK";
      health.services.campaignService = "OK";
      health.services.eventService = "OK";
    } catch (error) {
      health.services.databaseQuery = "ERROR";
      health.status = "DEGRADED";
      console.error("Health check database query error:", error);
    }

    const statusCode = health.status === "OK" ? 200 : health.status === "DEGRADED" ? 200 : 500;

    return res.status(statusCode).send({
      success: health.status !== "ERROR",
      message: `Application health status: ${health.status}`,
      health
    });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(500).send({
      success: false,
      message: "Health check failed",
      error: error.message
    });
  }
};

module.exports = {
  healthCheckController
};
