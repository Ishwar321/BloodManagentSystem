const userModel = require('../models/userModel');
const inventoryModel = require('../models/inventoryModel');
const campaignModel = require('../models/campaignModel');
const eventModel = require('../models/eventModel');

// Get comprehensive analytics dashboard
const getAnalyticsController = async (req, res) => {
  try {
    const { timeRange = '30', role } = req.query;
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Base query for date filtering
    const dateQuery = { createdAt: { $gte: startDate } };

    // Get user statistics
    const userStats = await Promise.all([
      userModel.countDocuments({ role: 'donar', ...dateQuery }),
      userModel.countDocuments({ role: 'hospital', ...dateQuery }),
      userModel.countDocuments({ role: 'organisation', ...dateQuery }),
      userModel.countDocuments({ ...dateQuery })
    ]);

    // Get blood inventory statistics
    const bloodStats = await Promise.all([
      inventoryModel.countDocuments({ inventoryType: 'in', ...dateQuery }),
      inventoryModel.countDocuments({ inventoryType: 'out', ...dateQuery }),
      inventoryModel.aggregate([
        { $match: { inventoryType: 'in', ...dateQuery } },
        { $group: { _id: '$bloodGroup', total: { $sum: '$quantity' } } }
      ]),
      inventoryModel.aggregate([
        { $match: { inventoryType: 'out', ...dateQuery } },
        { $group: { _id: '$bloodGroup', total: { $sum: '$quantity' } } }
      ])
    ]);

    // Get monthly trends
    const monthlyTrends = await inventoryModel.aggregate([
      { $match: { ...dateQuery } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: '$inventoryType'
          },
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top performing organizations
    const topOrganizations = await inventoryModel.aggregate([
      { $match: { inventoryType: 'in', ...dateQuery } },
      { $group: { _id: '$organisation', totalDonations: { $sum: '$quantity' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'orgDetails' } },
      { $unwind: '$orgDetails' },
      { $sort: { totalDonations: -1 } },
      { $limit: 10 }
    ]);

    // Get blood group distribution
    const bloodGroupDistribution = await userModel.aggregate([
      { $match: { role: 'donar' } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get campaign and event statistics if organization
    let campaignStats = [];
    let eventStats = [];
    if (role === 'organisation') {
      campaignStats = await campaignModel.aggregate([
        { $match: { organisation: req.body.userId, ...dateQuery } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      eventStats = await eventModel.aggregate([
        { $match: { organisation: req.body.userId, ...dateQuery } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
    }

    const analytics = {
      userStatistics: {
        newDonors: userStats[0],
        newHospitals: userStats[1],
        newOrganizations: userStats[2],
        totalNewUsers: userStats[3]
      },
      bloodStatistics: {
        totalDonations: bloodStats[0],
        totalRequests: bloodStats[1],
        donationsByBloodGroup: bloodStats[2],
        requestsByBloodGroup: bloodStats[3]
      },
      trends: {
        monthly: monthlyTrends,
        bloodGroup: bloodGroupDistribution
      },
      topPerformers: {
        organizations: topOrganizations
      },
      timeRange: `${days} days`,
      generatedAt: new Date()
    };

    // Add organization-specific data
    if (role === 'organisation') {
      analytics.organizationData = {
        campaigns: campaignStats,
        events: eventStats
      };
    }

    return res.status(200).send({
      success: true,
      message: 'Analytics data fetched successfully',
      analytics
    });

  } catch (error) {
    console.error('Error in getAnalyticsController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
};

// Get real-time dashboard metrics
const getRealTimeMetricsController = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's metrics
    const todayMetrics = await Promise.all([
      inventoryModel.countDocuments({ 
        inventoryType: 'in', 
        createdAt: { $gte: today } 
      }),
      inventoryModel.countDocuments({ 
        inventoryType: 'out', 
        createdAt: { $gte: today } 
      }),
      userModel.countDocuments({ 
        role: 'donar', 
        createdAt: { $gte: today } 
      }),
      inventoryModel.aggregate([
        { $group: { _id: '$bloodGroup', available: { $sum: { $cond: [{ $eq: ['$inventoryType', 'in'] }, '$quantity', { $multiply: ['$quantity', -1] }] } } } },
        { $sort: { available: -1 } }
      ])
    ]);

    // Get critical blood levels (less than 10 units)
    const criticalLevels = todayMetrics[3].filter(blood => blood.available < 10);

    // Get recent activities
    const recentActivities = await inventoryModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('donar', 'name bloodGroup')
      .populate('hospital', 'hospitalName')
      .populate('organisation', 'organisationName');

    return res.status(200).send({
      success: true,
      message: 'Real-time metrics fetched successfully',
      metrics: {
        today: {
          donations: todayMetrics[0],
          requests: todayMetrics[1],
          newDonors: todayMetrics[2]
        },
        bloodAvailability: todayMetrics[3],
        criticalLevels,
        recentActivities,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error in getRealTimeMetricsController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error fetching real-time metrics',
      error: error.message
    });
  }
};

// Export data for reporting
const exportDataController = async (req, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    let data = [];
    let filename = '';

    switch (type) {
      case 'donations':
        data = await inventoryModel
          .find({ inventoryType: 'in', ...dateQuery })
          .populate('donar', 'name email bloodGroup')
          .populate('organisation', 'organisationName')
          .sort({ createdAt: -1 });
        filename = 'donations_export';
        break;

      case 'requests':
        data = await inventoryModel
          .find({ inventoryType: 'out', ...dateQuery })
          .populate('hospital', 'hospitalName email')
          .sort({ createdAt: -1 });
        filename = 'requests_export';
        break;

      case 'users':
        data = await userModel
          .find({ ...dateQuery })
          .select('-password')
          .sort({ createdAt: -1 });
        filename = 'users_export';
        break;

      case 'inventory':
        data = await inventoryModel.aggregate([
          { $group: { 
            _id: '$bloodGroup', 
            available: { 
              $sum: { 
                $cond: [
                  { $eq: ['$inventoryType', 'in'] }, 
                  '$quantity', 
                  { $multiply: ['$quantity', -1] }
                ] 
              } 
            },
            totalDonations: { 
              $sum: { 
                $cond: [
                  { $eq: ['$inventoryType', 'in'] }, 
                  '$quantity', 
                  0
                ] 
              } 
            },
            totalRequests: { 
              $sum: { 
                $cond: [
                  { $eq: ['$inventoryType', 'out'] }, 
                  '$quantity', 
                  0
                ] 
              } 
            }
          }},
          { $sort: { _id: 1 } }
        ]);
        filename = 'inventory_summary';
        break;

      default:
        return res.status(400).send({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      return res.send(csv);
    }

    return res.status(200).send({
      success: true,
      message: 'Data exported successfully',
      data,
      exportInfo: {
        type,
        format,
        recordCount: data.length,
        exportedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error in exportDataController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

module.exports = {
  getAnalyticsController,
  getRealTimeMetricsController,
  exportDataController
};
