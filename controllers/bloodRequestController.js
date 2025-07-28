const BloodRequest = require('../models/bloodRequestModel');
const inventoryModel = require('../models/inventoryModel');
const userModel = require('../models/userModel');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');

// Create blood request
const createBloodRequestController = async (req, res) => {
  try {
    const {
      bloodGroup,
      quantity,
      urgency,
      purpose,
      description,
      requiredBy,
      patientInfo,
      contactPerson,
      estimatedCost
    } = req.body;

    // Validation
    if (!bloodGroup || !quantity || !purpose || !requiredBy || !contactPerson) {
      return res.status(400).send({
        success: false,
        message: 'Please provide all required fields: bloodGroup, quantity, purpose, requiredBy, contactPerson'
      });
    }

    // Validate required by date is not in the past
    const requiredDate = new Date(requiredBy);
    if (requiredDate <= new Date()) {
      return res.status(400).send({
        success: false,
        message: 'Required by date must be in the future'
      });
    }

    // Create blood request
    const bloodRequest = new BloodRequest({
      hospital: req.body.userId,
      bloodGroup,
      quantity: parseInt(quantity),
      urgency: urgency || 'medium',
      purpose,
      description,
      requiredBy: requiredDate,
      patientInfo,
      contactPerson,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      metadata: {
        sourceIP: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await bloodRequest.save();

    // Check available inventory
    const availableBlood = await inventoryModel.aggregate([
      {
        $match: {
          bloodGroup: bloodGroup,
          inventoryType: 'in'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantity' }
        }
      }
    ]);

    const requestedBlood = await inventoryModel.aggregate([
      {
        $match: {
          bloodGroup: bloodGroup,
          inventoryType: 'out'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantity' }
        }
      }
    ]);

    const available = (availableBlood[0]?.total || 0) - (requestedBlood[0]?.total || 0);

    // Add initial note
    let noteMessage = `Blood request created for ${quantity} units of ${bloodGroup} blood.`;
    if (available >= quantity) {
      noteMessage += ` Sufficient blood available in inventory (${available} units).`;
    } else {
      noteMessage += ` Insufficient blood in inventory (${available} units available).`;
    }

    await bloodRequest.addNote(req.body.userId, noteMessage, 'info');

    // Send notification email to hospital
    const hospital = await userModel.findById(req.body.userId);
    if (hospital && hospital.email) {
      await emailService.sendBloodRequestNotification(hospital, bloodGroup, quantity);
    }

    // Notify organizations if urgent request
    if (urgency === 'critical' || urgency === 'high') {
      const organizations = await userModel.find({ role: 'organisation' });
      // Here you would send notifications to organizations
      logger.info(`Urgent blood request created: ${bloodRequest._id}`);
    }

    return res.status(201).send({
      success: true,
      message: 'Blood request created successfully',
      bloodRequest,
      availableInventory: available
    });

  } catch (error) {
    logger.error('Error in createBloodRequestController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error creating blood request',
      error: error.message
    });
  }
};

// Get blood requests for hospital
const getBloodRequestsController = async (req, res) => {
  try {
    const { status, bloodGroup, urgency, page = 1, limit = 10 } = req.query;
    const hospitalId = req.body.userId;

    // Build query
    const query = { hospital: hospitalId };
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (urgency) query.urgency = urgency;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bloodRequests = await BloodRequest.find(query)
      .populate('hospital', 'hospitalName email phone')
      .populate('approvedBy', 'name email')
      .populate('fulfilledBy.organisation', 'organisationName')
      .populate('notes.author', 'name role')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRequests = await BloodRequest.countDocuments(query);

    return res.status(200).send({
      success: true,
      message: 'Blood requests fetched successfully',
      bloodRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequests / parseInt(limit)),
        totalRequests,
        hasNext: skip + parseInt(limit) < totalRequests,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    logger.error('Error in getBloodRequestsController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error fetching blood requests',
      error: error.message
    });
  }
};

// Get all blood requests (for organizations and admin)
const getAllBloodRequestsController = async (req, res) => {
  try {
    const { status, bloodGroup, urgency, hospital, page = 1, limit = 20 } = req.query;
    const userRole = req.body.userRole;

    // Check if user has permission
    if (!['organisation', 'admin'].includes(userRole)) {
      return res.status(403).send({
        success: false,
        message: 'Access denied. Only organizations and admins can view all requests.'
      });
    }

    // Build query
    const query = {};
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (urgency) query.urgency = urgency;
    if (hospital) query.hospital = hospital;

    // For urgent requests, prioritize critical and high urgency
    if (req.query.urgent === 'true') {
      query.urgency = { $in: ['critical', 'high'] };
      query.status = { $in: ['pending', 'partially_fulfilled'] };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bloodRequests = await BloodRequest.find(query)
      .populate('hospital', 'hospitalName email phone address')
      .populate('approvedBy', 'name email')
      .populate('fulfilledBy.organisation', 'organisationName')
      .sort({ priority: -1, urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRequests = await BloodRequest.countDocuments(query);

    // Get statistics
    const statistics = await BloodRequest.getStatistics();

    return res.status(200).send({
      success: true,
      message: 'Blood requests fetched successfully',
      bloodRequests,
      statistics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequests / parseInt(limit)),
        totalRequests,
        hasNext: skip + parseInt(limit) < totalRequests,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    logger.error('Error in getAllBloodRequestsController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error fetching blood requests',
      error: error.message
    });
  }
};

// Update blood request status
const updateBloodRequestController = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason, note } = req.body;
    const userId = req.body.userId;
    const userRole = req.body.userRole;

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).send({
        success: false,
        message: 'Blood request not found'
      });
    }

    // Check permissions
    if (userRole === 'hospital' && bloodRequest.hospital.toString() !== userId) {
      return res.status(403).send({
        success: false,
        message: 'Access denied. You can only update your own requests.'
      });
    }

    // Update status
    if (status) {
      bloodRequest.status = status;
      
      if (status === 'approved') {
        bloodRequest.approvedBy = userId;
      }
      
      if (status === 'rejected' && rejectionReason) {
        bloodRequest.rejectionReason = rejectionReason;
      }
    }

    // Add note if provided
    if (note) {
      await bloodRequest.addNote(userId, note, 'info');
    }

    await bloodRequest.save();

    // Log the update
    logger.info(`Blood request ${requestId} updated to ${status} by user ${userId}`);

    return res.status(200).send({
      success: true,
      message: 'Blood request updated successfully',
      bloodRequest
    });

  } catch (error) {
    logger.error('Error in updateBloodRequestController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error updating blood request',
      error: error.message
    });
  }
};

// Fulfill blood request
const fulfillBloodRequestController = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { quantity } = req.body;
    const organisationId = req.body.userId;
    const userRole = req.body.userRole;

    // Check if user is organization
    if (userRole !== 'organisation') {
      return res.status(403).send({
        success: false,
        message: 'Only organizations can fulfill blood requests'
      });
    }

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).send({
        success: false,
        message: 'Blood request not found'
      });
    }

    // Check if request can be fulfilled
    if (!['pending', 'partially_fulfilled'].includes(bloodRequest.status)) {
      return res.status(400).send({
        success: false,
        message: 'This request cannot be fulfilled'
      });
    }

    // Validate quantity
    const fulfillQuantity = parseInt(quantity);
    if (!fulfillQuantity || fulfillQuantity <= 0) {
      return res.status(400).send({
        success: false,
        message: 'Invalid quantity'
      });
    }

    // Check organization's inventory
    const orgInventory = await inventoryModel.aggregate([
      {
        $match: {
          organisation: organisationId,
          bloodGroup: bloodRequest.bloodGroup,
          inventoryType: 'in'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantity' }
        }
      }
    ]);

    const orgRequests = await inventoryModel.aggregate([
      {
        $match: {
          organisation: organisationId,
          bloodGroup: bloodRequest.bloodGroup,
          inventoryType: 'out'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantity' }
        }
      }
    ]);

    const availableQuantity = (orgInventory[0]?.total || 0) - (orgRequests[0]?.total || 0);

    if (availableQuantity < fulfillQuantity) {
      return res.status(400).send({
        success: false,
        message: `Insufficient inventory. Available: ${availableQuantity} units`
      });
    }

    // Fulfill the request
    await bloodRequest.fulfill(organisationId, fulfillQuantity);

    // Create inventory record for the fulfillment
    const inventoryRecord = new inventoryModel({
      inventoryType: 'out',
      bloodGroup: bloodRequest.bloodGroup,
      quantity: fulfillQuantity,
      organisation: organisationId,
      hospital: bloodRequest.hospital,
      email: req.body.email || '',
      description: `Blood request fulfillment - Request ID: ${requestId}`
    });

    await inventoryRecord.save();

    // Add note to blood request
    await bloodRequest.addNote(
      organisationId,
      `Fulfilled ${fulfillQuantity} units of ${bloodRequest.bloodGroup} blood`,
      'info'
    );

    logger.info(`Blood request ${requestId} fulfilled with ${fulfillQuantity} units by organization ${organisationId}`);

    return res.status(200).send({
      success: true,
      message: 'Blood request fulfilled successfully',
      fulfillmentDetails: {
        quantity: fulfillQuantity,
        bloodGroup: bloodRequest.bloodGroup,
        status: bloodRequest.status
      }
    });

  } catch (error) {
    logger.error('Error in fulfillBloodRequestController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error fulfilling blood request',
      error: error.message
    });
  }
};

// Get urgent requests
const getUrgentRequestsController = async (req, res) => {
  try {
    const urgentRequests = await BloodRequest.findUrgent()
      .populate('hospital', 'hospitalName email phone address')
      .limit(20);

    return res.status(200).send({
      success: true,
      message: 'Urgent blood requests fetched successfully',
      urgentRequests,
      count: urgentRequests.length
    });

  } catch (error) {
    logger.error('Error in getUrgentRequestsController:', error);
    return res.status(500).send({
      success: false,
      message: 'Error fetching urgent requests',
      error: error.message
    });
  }
};

module.exports = {
  createBloodRequestController,
  getBloodRequestsController,
  getAllBloodRequestsController,
  updateBloodRequestController,
  fulfillBloodRequestController,
  getUrgentRequestsController
};
