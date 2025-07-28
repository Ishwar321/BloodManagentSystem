const userModel = require("../models/userModel");
const inventoryModel = require("../models/inventoryModel");
const mongoose = require("mongoose");

// GET DONOR LIST
const getDonarsListController = async (req, res) => {
  try {
    const donarData = await userModel
      .find({ role: "donar" })
      .sort({ createdAt: -1 });

    // Enrich donor data with blood group from inventory if not present in user data
    const inventoryModel = require("../models/inventoryModel");
    
    const enrichedDonarData = await Promise.all(
      donarData.map(async (donor) => {
        let donorObj = donor.toObject();
        
        // If bloodGroup is missing from user data, try to get it from inventory
        if (!donorObj.bloodGroup) {
          try {
            const inventoryRecord = await inventoryModel
              .findOne({ 
                email: donor.email, 
                inventoryType: "in" 
              })
              .sort({ createdAt: -1 });
            
            if (inventoryRecord && inventoryRecord.bloodGroup) {
              donorObj.bloodGroup = inventoryRecord.bloodGroup;
            }
          } catch (inventoryError) {
            console.log(`No inventory data found for donor ${donor.email}`);
          }
        }
        
        return donorObj;
      })
    );

    return res.status(200).send({
      success: true,
      totalCount: enrichedDonarData.length,
      message: "Donar List Fetched Successfully",
      donarData: enrichedDonarData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Donar List API",
      error,
    });
  }
};

// GET HOSPITAL LIST
const getHospitalListController = async (req, res) => {
  try {
    const hospitalData = await userModel
      .find({ role: "hospital" })
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      totalCount: hospitalData.length,
      message: "Hospital List Fetched Successfully",
      hospitalData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Hospital List API",
      error,
    });
  }
};

// GET ORGANIZATION LIST
const getOrgListController = async (req, res) => {
  try {
    const orgData = await userModel
      .find({ role: "organisation" })
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      totalCount: orgData.length,
      message: "Organization List Fetched Successfully",
      orgData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Organization List API",
      error,
    });
  }
};

// DELETE DONOR/HOSPITAL/ORGANIZATION
const deleteDonarController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID",
      });
    }

    await userModel.findByIdAndDelete(id);
    return res.status(200).send({
      success: true,
      message: "Record Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while deleting record",
      error,
    });
  }
};

// GET ADMIN DASHBOARD ANALYTICS
const getAdminDashboardController = async (req, res) => {
  try {
    // Get total counts
    const totalDonors = await userModel.countDocuments({ role: "donar" });
    const totalHospitals = await userModel.countDocuments({ role: "hospital" });
    const totalOrganizations = await userModel.countDocuments({ 
      role: "organisation" 
    });
    const totalInventory = await inventoryModel.countDocuments();

    // Get blood group wise inventory
    const bloodGroupData = await inventoryModel.aggregate([
      {
        $group: {
          _id: "$bloodGroup",
          totalIn: {
            $sum: {
              $cond: [{ $eq: ["$inventoryType", "in"] }, "$quantity", 0],
            },
          },
          totalOut: {
            $sum: {
              $cond: [{ $eq: ["$inventoryType", "out"] }, "$quantity", 0],
            },
          },
        },
      },
      {
        $project: {
          bloodGroup: "$_id",
          totalIn: 1,
          totalOut: 1,
          availableBlood: { $subtract: ["$totalIn", "$totalOut"] },
        },
      },
    ]);

    // Recent donations
    const recentDonations = await inventoryModel
      .find({ inventoryType: "in" })
      .populate("donar")
      .populate("organisation")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).send({
      success: true,
      message: "Admin Dashboard Data Fetched Successfully",
      data: {
        totalDonors,
        totalHospitals,
        totalOrganizations,
        totalInventory,
        bloodGroupData,
        recentDonations,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Admin Dashboard API",
      error,
    });
  }
};

module.exports = {
  getDonarsListController,
  getHospitalListController,
  getOrgListController,
  deleteDonarController,
  getAdminDashboardController,
};
