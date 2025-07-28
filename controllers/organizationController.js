const mongoose = require("mongoose");
const campaignModel = require("../models/campaignModel");
const eventModel = require("../models/eventModel");
const volunteerModel = require("../models/volunteerModel");
const partnershipModel = require("../models/partnershipModel");
const userModel = require("../models/userModel");
const donationCampModel = require("../models/donationCampModel");
const inventoryModel = require("../models/inventoryModel");

// GET ORGANIZATION DASHBOARD DATA
const getOrganizationDashboardController = async (req, res) => {
  try {
    const organisationId = req.body.userId;

    // Get basic stats
    const totalCamps = await donationCampModel.countDocuments({ 
      organizer: organisationId 
    });

    const upcomingCamps = await donationCampModel.countDocuments({
      organizer: organisationId,
      date: { $gte: new Date() },
      status: "upcoming"
    });

    const totalEvents = await eventModel.countDocuments({
      organisation: organisationId
    });

    const activePartners = await partnershipModel.countDocuments({
      organisation: organisationId,
      status: "active"
    });

    const volunteers = await volunteerModel.countDocuments({
      organisation: organisationId,
      status: "active"
    });

    const activeCampaigns = await campaignModel.countDocuments({
      organisation: organisationId,
      status: "active"
    });

    // Get recent activities
    const recentCamps = await donationCampModel
      .find({ organizer: organisationId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("organizer", "organisationName");

    const recentEvents = await eventModel
      .find({ organisation: organisationId })
      .sort({ createdAt: -1 })
      .limit(3);

    // Get upcoming events
    const upcomingEvents = await eventModel
      .find({
        organisation: organisationId,
        date: { $gte: new Date() }
      })
      .sort({ date: 1 })
      .limit(5);

    // Calculate total impact
    const impactData = await donationCampModel.aggregate([
      { $match: { organizer: new mongoose.Types.ObjectId(organisationId) } },
      {
        $group: {
          _id: null,
          totalDonorsReached: { $sum: { $size: "$registeredDonors" } },
          totalBloodCollected: { $sum: "$totalCollected" }
        }
      }
    ]);

    const impact = impactData[0] || {
      totalDonorsReached: 0,
      totalBloodCollected: 0
    };

    return res.status(200).send({
      success: true,
      message: "Organization dashboard data fetched successfully",
      data: {
        stats: {
          totalCamps,
          upcomingCamps,
          totalEvents,
          activePartners,
          volunteers,
          activeCampaigns,
          totalDonorsReached: impact.totalDonorsReached,
          totalBloodCollected: impact.totalBloodCollected || 0
        },
        recentActivities: {
          camps: recentCamps,
          events: recentEvents
        },
        upcomingEvents
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching organization dashboard data",
      error
    });
  }
};

// CREATE CAMPAIGN
const createCampaignController = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      startDate, 
      endDate, 
      targetAudience, 
      goals, 
      budget,
      tags 
    } = req.body;

    // Validation
    if (!title || !description || !startDate || !endDate || !targetAudience) {
      return res.status(400).send({
        success: false,
        message: "Please provide all required fields"
      });
    }

    const campaign = new campaignModel({
      title,
      description,
      type,
      startDate,
      endDate,
      targetAudience,
      goals,
      budget,
      tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
      organisation: req.body.userId
    });

    await campaign.save();

    return res.status(201).send({
      success: true,
      message: "Campaign created successfully",
      campaign
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in creating campaign",
      error
    });
  }
};

// GET CAMPAIGNS
const getCampaignsController = async (req, res) => {
  try {
    const organisationId = req.body.userId;
    console.log("Fetching campaigns for organization:", organisationId);
    
    const campaigns = await campaignModel
      .find({ organisation: organisationId })
      .sort({ createdAt: -1 })
      .populate("organisation", "organisationName");

    console.log("Found campaigns:", campaigns.length);

    return res.status(200).send({
      success: true,
      message: "Campaigns fetched successfully",
      campaigns
    });
  } catch (error) {
    console.log("Error in getCampaignsController:", error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching campaigns",
      error
    });
  }
};

// CREATE EVENT
const createEventController = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      date,
      startTime,
      endTime,
      location,
      expectedAttendees,
      requirements
    } = req.body;

    // Validation
    if (!title || !description || !date || !startTime || !endTime || !location || !expectedAttendees) {
      return res.status(400).send({
        success: false,
        message: "Please provide all required fields: title, description, date, startTime, endTime, location, expectedAttendees"
      });
    }

    // Validate location structure
    let locationObj;
    if (typeof location === 'string') {
      locationObj = { address: location };
    } else if (location && location.address) {
      locationObj = location;
    } else {
      return res.status(400).send({
        success: false,
        message: "Location must have an address field"
      });
    }

    // Validate expectedAttendees is a positive number
    const attendees = parseInt(expectedAttendees);
    if (isNaN(attendees) || attendees <= 0) {
      return res.status(400).send({
        success: false,
        message: "Expected attendees must be a positive number"
      });
    }

    // Validate event type
    const validTypes = ["blood_drive", "awareness_seminar", "workshop", "conference", "community_outreach"];
    const eventType = type && validTypes.includes(type) ? type : "blood_drive";

    const event = new eventModel({
      title,
      description,
      type: eventType,
      date,
      startTime,
      endTime,
      location: locationObj,
      expectedAttendees: attendees,
      requirements: requirements || { equipment: [], staff: [], supplies: [] },
      organisation: req.body.userId
    });

    await event.save();

    return res.status(201).send({
      success: true,
      message: "Event created successfully",
      event
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in creating event",
      error
    });
  }
};

// GET EVENTS
const getEventsController = async (req, res) => {
  try {
    const organisationId = req.body.userId;
    console.log("Fetching events for organization:", organisationId);
    
    const events = await eventModel
      .find({ organisation: organisationId })
      .sort({ date: 1 })
      .populate("organisation", "organisationName")
      .populate("volunteers.volunteer", "name email")
      .populate("registeredDonors.donor", "name email");

    console.log("Found events:", events.length);

    return res.status(200).send({
      success: true,
      message: "Events fetched successfully",
      events
    });
  } catch (error) {
    console.log("Error in getEventsController:", error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching events",
      error
    });
  }
};

// GET DONOR NETWORK
const getDonorNetworkController = async (req, res) => {
  try {
    const organisationId = req.body.userId;

    // Get donors who have participated in this organization's camps
    const donorCamps = await donationCampModel
      .find({ organizer: organisationId })
      .populate("registeredDonors.donor", "name email phone bloodGroup createdAt")
      .select("registeredDonors");

    // Flatten and deduplicate donors
    const allDonors = [];
    const donorIds = new Set();

    donorCamps.forEach(camp => {
      camp.registeredDonors.forEach(registration => {
        if (registration.donor && !donorIds.has(registration.donor._id.toString())) {
          donorIds.add(registration.donor._id.toString());
          allDonors.push({
            ...registration.donor.toObject(),
            lastRegistration: registration.registrationDate,
            lastStatus: registration.status
          });
        }
      });
    });

    // Get additional donor stats
    const donorStats = await Promise.all(
      allDonors.map(async (donor) => {
        const campsParticipated = await donationCampModel.countDocuments({
          organizer: organisationId,
          "registeredDonors.donor": donor._id
        });

        const lastParticipation = await donationCampModel
          .findOne({
            organizer: organisationId,
            "registeredDonors.donor": donor._id
          })
          .sort({ date: -1 });

        return {
          ...donor,
          campsParticipated,
          lastParticipation: lastParticipation?.date,
          engagementScore: Math.min(100, campsParticipated * 20 + Math.random() * 20),
          status: lastParticipation && new Date() - new Date(lastParticipation.date) < 90 * 24 * 60 * 60 * 1000 ? 'active' : 'inactive'
        };
      })
    );

    return res.status(200).send({
      success: true,
      message: "Donor network fetched successfully",
      donors: donorStats
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching donor network",
      error
    });
  }
};

// GET PARTNERSHIPS
const getPartnershipsController = async (req, res) => {
  try {
    const organisationId = req.body.userId;
    const partnerships = await partnershipModel
      .find({ organisation: organisationId })
      .populate("hospital", "hospitalName email phone address")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      message: "Partnerships fetched successfully",
      partnerships
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching partnerships",
      error
    });
  }
};

// CREATE PARTNERSHIP
const createPartnershipController = async (req, res) => {
  try {
    const { hospitalId, type, terms, contactPersons } = req.body;

    if (!hospitalId) {
      return res.status(400).send({
        success: false,
        message: "Hospital ID is required"
      });
    }

    // Check if partnership already exists
    const existingPartnership = await partnershipModel.findOne({
      organisation: req.body.userId,
      hospital: hospitalId
    });

    if (existingPartnership) {
      return res.status(400).send({
        success: false,
        message: "Partnership with this hospital already exists"
      });
    }

    const partnership = new partnershipModel({
      organisation: req.body.userId,
      hospital: hospitalId,
      type,
      terms,
      contactPersons
    });

    await partnership.save();

    return res.status(201).send({
      success: true,
      message: "Partnership created successfully",
      partnership
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in creating partnership",
      error
    });
  }
};

// UPDATE CAMPAIGN
const updateCampaignController = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const updates = req.body;

    const campaign = await campaignModel.findOneAndUpdate(
      { _id: campaignId, organisation: req.body.userId },
      updates,
      { new: true }
    );

    if (!campaign) {
      return res.status(404).send({
        success: false,
        message: "Campaign not found"
      });
    }

    return res.status(200).send({
      success: true,
      message: "Campaign updated successfully",
      campaign
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in updating campaign",
      error
    });
  }
};

// Hospital Partners endpoints
const getHospitalPartnersController = async (req, res) => {
  try {
    const organisationId = req.body.userId;
    const partnerships = await partnershipModel
      .find({ 
        organisation: organisationId,
        type: 'hospital'
      })
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      message: "Hospital partnerships fetched successfully",
      partnerships
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching hospital partnerships",
      error
    });
  }
};

const createHospitalPartnershipController = async (req, res) => {
  try {
    const {
      hospitalName,
      contactPerson,
      email,
      phone,
      address,
      specialties,
      capacity,
      emergencyContact,
      collaborationType
    } = req.body;

    // Validation
    if (!hospitalName || !contactPerson || !email || !phone) {
      return res.status(400).send({
        success: false,
        message: "Please provide all required fields"
      });
    }

    const partnership = new partnershipModel({
      hospitalName,
      contactPerson,
      email,
      phone,
      address,
      specialties: specialties ? specialties.split(",").map(s => s.trim()) : [],
      capacity,
      emergencyContact,
      collaborationType,
      type: 'hospital',
      organisation: req.body.userId,
      status: 'active'
    });

    await partnership.save();

    return res.status(201).send({
      success: true,
      message: "Hospital partnership created successfully",
      partnership
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in creating hospital partnership",
      error
    });
  }
};

// Get available hospitals for partnerships
const getAvailableHospitalsController = async (req, res) => {
  try {
    const hospitals = await userModel
      .find({ role: "hospital" })
      .select("hospitalName email phone address website")
      .sort({ hospitalName: 1 });

    return res.status(200).send({
      success: true,
      message: "Available hospitals fetched successfully",
      hospitals
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching available hospitals",
      error
    });
  }
};

// Add donor to organization network
const addDonorController = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      bloodGroup,
      address,
      age,
      gender,
      weight,
      dateOfBirth,
      emergencyContact,
      healthConditions
    } = req.body;

    // Validation
    if (!name || !email || !phone || !bloodGroup || !address || !age || !gender || !weight || !dateOfBirth) {
      return res.status(400).send({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: "A user with this email already exists"
      });
    }

    // Create new donor
    const newDonor = new userModel({
      role: "donar",
      name,
      email,
      phone,
      address,
      bloodGroup,
      dateOfBirth,
      age: parseInt(age),
      gender,
      weight: parseInt(weight),
      emergencyContact: emergencyContact || {},
      healthConditions: healthConditions || {},
      password: "defaultPassword123", // Temporary password - donor should change it
      isEligible: true
    });

    await newDonor.save();

    return res.status(201).send({
      success: true,
      message: "Donor added successfully",
      donor: newDonor
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in adding donor",
      error
    });
  }
};

// Export donors data
const exportDonorsController = async (req, res) => {
  try {
    const organisationId = req.body.userId;
    
    // Get all donors who have donated through this organization
    const donorIds = await inventoryModel.distinct("donar", {
      organisation: organisationId
    });

    const donors = await userModel
      .find({ 
        $or: [
          { _id: { $in: donorIds } },
          { role: "donar" } // Include all donors for organizations
        ]
      })
      .select("name email phone bloodGroup address createdAt")
      .sort({ createdAt: -1 });

    // Add donation stats for each donor
    const donorsWithStats = await Promise.all(donors.map(async (donor) => {
      const donations = await inventoryModel.find({
        donar: donor._id,
        organisation: organisationId,
        inventoryType: "in"
      });

      return {
        ...donor.toObject(),
        totalDonations: donations.length,
        lastDonation: donations.length > 0 ? donations[donations.length - 1].createdAt : null,
        joinDate: donor.createdAt,
        status: "active",
        engagementScore: Math.min(100, donations.length * 10 + 50)
      };
    }));

    return res.status(200).send({
      success: true,
      message: "Donors data exported successfully",
      donors: donorsWithStats
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in exporting donors data",
      error
    });
  }
};

module.exports = {
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
};
