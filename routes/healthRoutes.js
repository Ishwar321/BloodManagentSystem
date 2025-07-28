const express = require("express");
const { healthCheckController } = require("../controllers/healthController");

const router = express.Router();

// HEALTH CHECK ROUTE
router.get("/health", healthCheckController);

module.exports = router;
