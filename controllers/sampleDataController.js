const campaignModel = require("../models/campaignModel");
const eventModel = require("../models/eventModel");
const userModel = require("../models/userModel");

// CREATE SAMPLE DATA CONTROLLER
const createSampleDataController = async (req, res) => {
  try {
    const organisationId = req.body.userId;
    
    // Check if user is an organization
    const user = await userModel.findById(organisationId);
    if (!user || user.role !== 'organisation') {
      return res.status(403).send({
        success: false,
        message: 'Only organizations can create sample data'
      });
    }

    // Create sample campaigns
    const sampleCampaigns = [
      {
        title: "Blood Donation Awareness Campaign",
        description: "A comprehensive campaign to raise awareness about the importance of blood donation in our community.",
        type: "awareness",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        targetAudience: "General public, students, corporate employees",
        goals: "Increase blood donation awareness by 50% in the target demographic",
        budget: 15000,
        status: "active",
        organisation: organisationId
      },
      {
        title: "Corporate Blood Drive Initiative",
        description: "Partnering with local businesses to organize workplace blood donation drives.",
        type: "corporate",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        targetAudience: "Corporate employees, business partners",
        goals: "Collect 500 units of blood through corporate partnerships",
        budget: 25000,
        status: "planning",
        organisation: organisationId
      }
    ];

    // Create sample events
    const sampleEvents = [
      {
        title: "Community Blood Drive",
        description: "A large-scale community blood donation event at the city center.",
        type: "blood_drive",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        startTime: "09:00",
        endTime: "17:00",
        location: {
          address: "City Community Center, 123 Main Street",
          city: "Springfield",
          state: "IL",
          zipCode: "62701"
        },
        expectedAttendees: 200,
        status: "scheduled",
        organisation: organisationId
      },
      {
        title: "Blood Donation Awareness Seminar",
        description: "Educational seminar about blood donation benefits and procedures.",
        type: "awareness_seminar",
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        startTime: "14:00",
        endTime: "16:00",
        location: {
          address: "University Auditorium, 456 College Ave",
          city: "Springfield",
          state: "IL",
          zipCode: "62702"
        },
        expectedAttendees: 150,
        status: "confirmed",
        organisation: organisationId
      }
    ];

    // Insert sample data
    const createdCampaigns = await campaignModel.insertMany(sampleCampaigns);
    const createdEvents = await eventModel.insertMany(sampleEvents);

    return res.status(201).send({
      success: true,
      message: 'Sample data created successfully',
      data: {
        campaigns: createdCampaigns.length,
        events: createdEvents.length
      }
    });

  } catch (error) {
    console.error("Error creating sample data:", error);
    return res.status(500).send({
      success: false,
      message: 'Error creating sample data',
      error: error.message
    });
  }
};

module.exports = {
  createSampleDataController
};
