const donationCampModel = require("../models/donationCampModel");
const userModel = require("../models/userModel");
const notificationModel = require("../models/notificationModel");
const mongoose = require("mongoose");

// CREATE DONATION CAMP
const createDonationCampController = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      date,
      startTime,
      endTime,
      capacity,
      requirements,
      contactInfo,
    } = req.body;

    // Validate required fields
    if (!name || !location || !date || !startTime || !endTime || !capacity) {
      return res.status(400).send({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if camp date is in future
    if (new Date(date) <= new Date()) {
      return res.status(400).send({
        success: false,
        message: "Camp date must be in the future",
      });
    }

    const organizer = await userModel.findById(req.body.userId);
    if (!organizer || organizer.role !== "organisation") {
      return res.status(403).send({
        success: false,
        message: "Only verified organizations can create camps",
      });
    }

    const newCamp = new donationCampModel({
      name,
      organizer: req.body.userId,
      description,
      location,
      date,
      startTime,
      endTime,
      capacity,
      requirements: requirements || [],
      contactInfo,
    });

    await newCamp.save();

    return res.status(201).send({
      success: true,
      message: "Donation camp created successfully. Waiting for admin approval.",
      camp: newCamp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in creating donation camp",
      error,
    });
  }
};

// GET ALL CAMPS
const getCampsController = async (req, res) => {
  try {
    const { status, city, page = 1, limit = 10 } = req.query;
    const userId = req.body.userId;

    let query = {};
    
    const user = await userModel.findById(userId);
    
    if (user.role === "organisation") {
      query.organizer = userId;
    } else if (user.role === "donar") {
      query.isApproved = true;
      query.status = { $in: ["upcoming", "ongoing"] };
    }
    // Admin sees all camps

    if (status) query.status = status;
    if (city) query["location.city"] = new RegExp(city, "i");

    const camps = await donationCampModel
      .find(query)
      .populate("organizer", "organisationName email phone")
      .populate("approvedBy", "name")
      .populate("registeredDonors.donor", "name email phone bloodGroup")
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await donationCampModel.countDocuments(query);

    return res.status(200).send({
      success: true,
      message: "Camps fetched successfully",
      camps,
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
      message: "Error in fetching camps",
      error,
    });
  }
};

// REGISTER FOR CAMP
const registerForCampController = async (req, res) => {
  try {
    const { campId } = req.params;
    const userId = req.body.userId;

    if (!mongoose.isValidObjectId(campId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid camp ID",
      });
    }

    const donor = await userModel.findById(userId);
    if (!donor || donor.role !== "donar") {
      return res.status(400).send({
        success: false,
        message: "Only donors can register for camps",
      });
    }

    if (!donor.isEligible) {
      return res.status(400).send({
        success: false,
        message: "You are not eligible to donate blood currently",
      });
    }

    const camp = await donationCampModel.findById(campId);
    if (!camp) {
      return res.status(404).send({
        success: false,
        message: "Camp not found",
      });
    }

    if (!camp.isApproved) {
      return res.status(400).send({
        success: false,
        message: "Camp is not approved yet",
      });
    }

    if (camp.registeredDonors.length >= camp.capacity) {
      return res.status(400).send({
        success: false,
        message: "Camp is full",
      });
    }

    // Check if already registered
    const alreadyRegistered = camp.registeredDonors.some(
      reg => reg.donor.toString() === userId
    );

    if (alreadyRegistered) {
      return res.status(400).send({
        success: false,
        message: "Already registered for this camp",
      });
    }

    camp.registeredDonors.push({
      donor: userId,
    });

    await camp.save();

    // Send confirmation notification
    const notification = new notificationModel({
      title: "Camp Registration Confirmed",
      message: `You have successfully registered for ${camp.name} on ${new Date(camp.date).toLocaleDateString()}`,
      type: "camp_invitation",
      recipients: [{
        user: userId,
      }],
      metadata: {
        relatedCamp: campId,
      },
    });

    await notification.save();

    return res.status(200).send({
      success: true,
      message: "Successfully registered for the camp",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in camp registration",
      error,
    });
  }
};

// APPROVE CAMP (Admin only)
const approveCampController = async (req, res) => {
  try {
    const { campId } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.isValidObjectId(campId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid camp ID",
      });
    }

    const camp = await donationCampModel.findByIdAndUpdate(
      campId,
      {
        isApproved,
        approvedBy: req.body.userId,
      },
      { new: true }
    ).populate("organizer");

    if (!camp) {
      return res.status(404).send({
        success: false,
        message: "Camp not found",
      });
    }

    // Notify organizer
    const notification = new notificationModel({
      title: `Camp ${isApproved ? "Approved" : "Rejected"}`,
      message: `Your camp "${camp.name}" has been ${isApproved ? "approved" : "rejected"}`,
      type: isApproved ? "approval" : "rejection",
      recipients: [{
        user: camp.organizer._id,
      }],
      metadata: {
        relatedCamp: campId,
      },
    });

    await notification.save();

    // If approved, notify nearby donors
    if (isApproved) {
      const nearbyDonors = await userModel.find({
        role: "donar",
        isEligible: true,
        isActive: true,
        "location.city": camp.location.city,
      });

      if (nearbyDonors.length > 0) {
        const donorNotification = new notificationModel({
          title: "New Blood Donation Camp",
          message: `A new blood donation camp "${camp.name}" is organized in ${camp.location.city} on ${new Date(camp.date).toLocaleDateString()}`,
          type: "camp_invitation",
          recipients: nearbyDonors.map(donor => ({
            user: donor._id,
          })),
          metadata: {
            relatedCamp: campId,
          },
        });

        await donorNotification.save();
      }
    }

    return res.status(200).send({
      success: true,
      message: `Camp ${isApproved ? "approved" : "rejected"} successfully`,
      camp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in camp approval",
      error,
    });
  }
};

// UPDATE CAMP RESULTS (After camp completion)
const updateCampResultsController = async (req, res) => {
  try {
    const { campId } = req.params;
    const { totalCollected, requirements, registeredDonors } = req.body;

    if (!mongoose.isValidObjectId(campId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid camp ID",
      });
    }

    const camp = await donationCampModel.findById(campId);
    if (!camp) {
      return res.status(404).send({
        success: false,
        message: "Camp not found",
      });
    }

    // Update camp results
    camp.totalCollected = totalCollected;
    camp.status = "completed";
    
    if (requirements) {
      camp.requirements = requirements;
    }
    
    if (registeredDonors) {
      camp.registeredDonors = registeredDonors;
    }

    await camp.save();

    return res.status(200).send({
      success: true,
      message: "Camp results updated successfully",
      camp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in updating camp results",
      error,
    });
  }
};

// GET CAMP ANALYTICS
const getCampAnalyticsController = async (req, res) => {
  try {
    const totalCamps = await donationCampModel.countDocuments();
    const upcomingCamps = await donationCampModel.countDocuments({ 
      status: "upcoming",
      isApproved: true 
    });
    const completedCamps = await donationCampModel.countDocuments({ status: "completed" });
    const pendingApprovals = await donationCampModel.countDocuments({ 
      isApproved: false,
      status: "upcoming" 
    });

    // Total blood collected through camps
    const totalBloodCollected = await donationCampModel.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalCollected" } } },
    ]);

    // Camps by city
    const campsByCity = await donationCampModel.aggregate([
      {
        $group: {
          _id: "$location.city",
          count: { $sum: 1 },
          totalCollected: { $sum: "$totalCollected" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).send({
      success: true,
      message: "Camp analytics fetched successfully",
      data: {
        totalCamps,
        upcomingCamps,
        completedCamps,
        pendingApprovals,
        totalBloodCollected: totalBloodCollected[0]?.total || 0,
        campsByCity,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching camp analytics",
      error,
    });
  }
};

module.exports = {
  createDonationCampController,
  getCampsController,
  registerForCampController,
  approveCampController,
  updateCampResultsController,
  getCampAnalyticsController,
};
