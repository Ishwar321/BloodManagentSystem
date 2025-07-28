const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getAnalyticsController,
  getRealTimeMetricsController,
  exportDataController
} = require('../controllers/analyticsController');

const router = express.Router();

// Analytics routes
router.get('/analytics', authMiddleware, getAnalyticsController);
router.get('/metrics/realtime', authMiddleware, getRealTimeMetricsController);
router.get('/metrics', authMiddleware, getRealTimeMetricsController); // Add missing /metrics endpoint
router.get('/export', authMiddleware, exportDataController);

module.exports = router;
