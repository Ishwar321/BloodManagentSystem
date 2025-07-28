const requestModel = require("../models/requestModel");
const userModel = require("../models/userModel");
const notificationModel = require("../models/notificationModel");
const mongoose = require("mongoose");

// CREATE BLOOD REQUEST
const createBloodRequestController = async (req, res) => {
  try {
    const {
      bloodGroup,
      quantity,
      urgency,
      message,
      patientName,
      hospitalName,
      contactNumber,
      scheduledDate,
      location,
    } = req.body;

    // Validate required fields
    if (!bloodGroup || !quantity) {
      return res.status(400).send({
        success: false,
        message: "Blood group and quantity are required",
      });
    }

    const newRequest = new requestModel({
      requestType: "blood_request",
      requester: req.body.userId,
      bloodGroup,
      quantity,
      urgency: urgency || "medium",
      message,
      patientName,
      hospitalName,
      contactNumber,
      scheduledDate,
      location,
    });

    await newRequest.save();

    // Create notification for potential donors
    const notification = new notificationModel({
      title: `Urgent Blood Request - ${bloodGroup}`,
      message: `${quantity}ML of ${bloodGroup} blood needed. ${urgency === "critical" ? "CRITICAL EMERGENCY!" : ""}`,
      type: "blood_request",
      sender: req.body.userId,
      targetAudience: "donors",
      criteria: {
        bloodGroup: [bloodGroup],
      },
      priority: urgency === "critical" ? "urgent" : urgency,
      metadata: {
        relatedRequest: newRequest._id,
      },
    });

    // Find eligible donors
    const eligibleDonors = await userModel.find({
      role: "donar",
      bloodGroup: bloodGroup,
      isEligible: true,
      isActive: true,
    });

    notification.recipients = eligibleDonors.map(donor => ({
      user: donor._id,
    }));

    await notification.save();

    return res.status(201).send({
      success: true,
      message: "Blood request created successfully",
      request: newRequest,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in creating blood request",
      error,
    });
  }
};

// GET ALL REQUESTS
const getRequestsController = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const userId = req.body.userId;

    let query = {};
    
    // Filter by user role
    const user = await userModel.findById(userId);
    if (user.role === "donar") {
      // Donors see requests they can fulfill
      query.bloodGroup = user.bloodGroup;
    } else if (user.role === "hospital" || user.role === "organisation") {
      // Hospitals/Orgs see their own requests
      query.requester = userId;
    }
    // Admin sees all requests

    if (status) query.status = status;
    if (type) query.requestType = type;

    const requests = await requestModel
      .find(query)
      .populate("requester", "name email hospitalName organisationName")
      .populate("recipient", "name email hospitalName organisationName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await requestModel.countDocuments(query);

    return res.status(200).send({
      success: true,
      message: "Requests fetched successfully",
      requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching requests",
      error,
    });
  }
};

// UPDATE REQUEST STATUS
const updateRequestStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid request ID",
      });
    }

    const request = await requestModel.findByIdAndUpdate(
      id,
      { status, adminNotes },
      { new: true }
    ).populate("requester");

    if (!request) {
      return res.status(404).send({
        success: false,
        message: "Request not found",
      });
    }

    // Create notification for requester
    const notification = new notificationModel({
      title: `Request ${status}`,
      message: `Your blood request has been ${status}. ${adminNotes ? `Note: ${adminNotes}` : ""}`,
      type: status === "approved" ? "approval" : "rejection",
      recipients: [{
        user: request.requester._id,
      }],
    });

    await notification.save();

    return res.status(200).send({
      success: true,
      message: "Request status updated successfully",
      request,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in updating request status",
      error,
    });
  }
};

// CREATE DONATION APPOINTMENT
const createDonationAppointmentController = async (req, res) => {
  try {
    const {
      hospitalId,
      scheduledDate,
      message,
    } = req.body;

    const donor = await userModel.findById(req.body.userId);
    if (!donor || donor.role !== "donar") {
      return res.status(400).send({
        success: false,
        message: "Only donors can create appointments",
      });
    }

    if (!donor.isEligible) {
      return res.status(400).send({
        success: false,
        message: "You are not eligible to donate blood currently",
      });
    }

    const appointment = new requestModel({
      requestType: "donation_appointment",
      requester: req.body.userId,
      recipient: hospitalId,
      bloodGroup: donor.bloodGroup,
      quantity: 350, // Standard donation amount
      scheduledDate,
      message,
    });

    await appointment.save();

    // Notify hospital
    const notification = new notificationModel({
      title: "New Donation Appointment",
      message: `${donor.name} wants to donate ${donor.bloodGroup} blood`,
      type: "donation_reminder",
      recipients: [{
        user: hospitalId,
      }],
      metadata: {
        relatedRequest: appointment._id,
      },
    });

    await notification.save();

    return res.status(201).send({
      success: true,
      message: "Donation appointment created successfully",
      appointment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in creating appointment",
      error,
    });
  }
};

// GET DASHBOARD ANALYTICS FOR REQUESTS
const getRequestAnalyticsController = async (req, res) => {
  try {
    const totalRequests = await requestModel.countDocuments();
    const pendingRequests = await requestModel.countDocuments({ status: "pending" });
    const fulfilledRequests = await requestModel.countDocuments({ status: "fulfilled" });
    const criticalRequests = await requestModel.countDocuments({ urgency: "critical", status: "pending" });

    // Requests by blood group
    const requestsByBloodGroup = await requestModel.aggregate([
      {
        $group: {
          _id: "$bloodGroup",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    // Recent requests
    const recentRequests = await requestModel
      .find()
      .populate("requester", "name hospitalName organisationName")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).send({
      success: true,
      message: "Request analytics fetched successfully",
      data: {
        totalRequests,
        pendingRequests,
        fulfilledRequests,
        criticalRequests,
        requestsByBloodGroup,
        recentRequests,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching analytics",
      error,
    });
  }
};

module.exports = {
  createBloodRequestController,
  getRequestsController,
  updateRequestStatusController,
  createDonationAppointmentController,
  getRequestAnalyticsController,
};
