const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");

// CREATE INVENTORY
const createInventoryController = async (req, res) => {
  try {
    const { inventoryType, bloodGroup, quantity } = req.body;
    
    // Get logged-in user's ID from auth middleware
    const userId = req.body.userId;
    
    console.log("🩸 Inventory Creation Request:", {
      inventoryType,
      bloodGroup, 
      quantity,
      userId,
      userRole: "checking..."
    });
    
    // Validate required fields
    if (!inventoryType || !userId || !bloodGroup || !quantity) {
      return res.status(400).send({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate userId format
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Find User by ID instead of email
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User Not Found" });
    }

    console.log("👤 User found:", {
      role: user.role,
      email: user.email,
      name: user.name || user.hospitalName || user.organisationName
    });

    // Automatically use the logged-in user's email
    const email = user.email;

    if (inventoryType === "in" && user.role !== "donar" && user.role !== "organisation" && user.role !== "hospital" && user.role !== "admin") {
      return res
        .status(403)
        .send({ success: false, message: "Only donors, organizations, hospitals, and admins can add blood to inventory" });
    }
    if (inventoryType === "out" && user.role !== "hospital" && user.role !== "admin") {
      return res
        .status(403)
        .send({ success: false, message: "Only hospitals and admins can dispense blood from inventory" });
    }
    
    // Organizations can add blood from donation camps
    if (user.role === "organisation" && inventoryType === "out") {
      return res
        .status(403)
        .send({ 
          success: false, 
          message: "Organizations can collect blood but cannot dispense it. Only hospitals can dispense blood." 
        });
    }

    if (inventoryType === "out") {
      // For hospitals requesting blood, we need to find available organizations
      if (user.role === "hospital") {
        // Find the total available blood from all organizations
        const totalInOfRequestedBlood = await inventoryModel.aggregate([
          { $match: { inventoryType: "in", bloodGroup } },
          { $group: { _id: "$bloodGroup", total: { $sum: "$quantity" } } },
        ]);

        const totalIn = totalInOfRequestedBlood[0]?.total || 0;

        // Calculate OUT Blood Quantity from all organizations
        const totalOutOfRequestedBloodGroup = await inventoryModel.aggregate([
          { $match: { inventoryType: "out", bloodGroup } },
          { $group: { _id: "$bloodGroup", total: { $sum: "$quantity" } } },
        ]);

        const totalOut = totalOutOfRequestedBloodGroup[0]?.total || 0;
        const availableQuantity = totalIn - totalOut;

        if (availableQuantity < quantity) {
          return res.status(400).send({
            success: false,
            message: `Only ${availableQuantity}ML of ${bloodGroup.toUpperCase()} is available`,
          });
        }

        // Find the first organization that has this blood type available
        const availableOrgs = await inventoryModel.find({
          inventoryType: "in",
          bloodGroup
        }).populate('organisation');

        if (availableOrgs.length === 0) {
          return res.status(400).send({
            success: false,
            message: `No organizations have ${bloodGroup.toUpperCase()} blood available`,
          });
        }

        // Use the first available organization
        req.body.organisation = availableOrgs[0].organisation._id;
        req.body.hospital = user._id;
        req.body.email = email; // Use hospital's email for out requests
      } else {
        // For admin users, they can specify the organization
        const organisation = new mongoose.Types.ObjectId(userId);

        // Calculate Blood Quantity
        const totalInOfRequestedBlood = await inventoryModel.aggregate([
          { $match: { organisation, inventoryType: "in", bloodGroup } },
          { $group: { _id: "$bloodGroup", total: { $sum: "$quantity" } } },
        ]);

        const totalIn = totalInOfRequestedBlood[0]?.total || 0;

        // Calculate OUT Blood Quantity
        const totalOutOfRequestedBloodGroup = await inventoryModel.aggregate([
          { $match: { organisation, inventoryType: "out", bloodGroup } },
          { $group: { _id: "$bloodGroup", total: { $sum: "$quantity" } } },
        ]);

        const totalOut = totalOutOfRequestedBloodGroup[0]?.total || 0;
        const availableQuantity = totalIn - totalOut;

        if (availableQuantity < quantity) {
          return res.status(400).send({
            success: false,
            message: `Only ${availableQuantity}ML of ${bloodGroup.toUpperCase()} is available`,
          });
        }

        req.body.hospital = user._id;
      }
    } else {
      // For donors, hospitals, and organizations adding blood
      if (user.role === "organisation") {
        // For organizations, we need to specify which donor donated (from form data)
        if (req.body.donorId) {
          // Existing donor case
          const donor = await userModel.findById(req.body.donorId);
          if (!donor || donor.role !== "donar") {
            return res.status(400).send({
              success: false,
              message: "Invalid donor selected"
            });
          }
          req.body.donar = req.body.donorId;
          req.body.email = donor.email; // Use donor's email
        } else if (req.body.isNewDonor) {
          // New donor case - create donor first
          // Validate required fields for new donor
          if (!req.body.donorName || !req.body.email || !req.body.bloodGroup) {
            return res.status(400).send({
              success: false,
              message: "Name, email, and blood group are required for new donors"
            });
          }

          // Check if email already exists
          const existingUser = await userModel.findOne({ email: req.body.email });
          if (existingUser) {
            return res.status(400).send({
              success: false,
              message: "A user with this email already exists"
            });
          }

          const newDonor = new userModel({
            role: "donar",
            name: req.body.donorName,
            email: req.body.email,
            phone: req.body.donorPhone || "000-000-0000", // Default phone if not provided
            bloodGroup: req.body.bloodGroup,
            password: "defaultPassword123", // Default password - donor should change later
            address: req.body.donorAddress || "Address not provided", // Default address if not provided
            isEligible: true,
            healthConditions: {
              diabetes: false,
              hypertension: false,
              heartDisease: false,
              anemia: false,
              other: ""
            }
          });
          
          const savedDonor = await newDonor.save();
          req.body.donar = savedDonor._id;
        } else {
          req.body.donar = user._id;
          req.body.email = email; // Use organization's email
        }
        req.body.collectedBy = user._id; // Track which organization collected it
      } else if (user.role === "hospital") {
        console.log("🏥 Hospital adding blood - checking donor info...");
        console.log("Request body:", {
          donorId: req.body.donorId,
          isNewDonor: req.body.isNewDonor,
          donorName: req.body.donorName
        });
        
        // For hospitals adding blood, they can either:
        // 1. Add blood from an existing donor
        // 2. Add blood from a walk-in donor (create new donor)
        // 3. Add blood directly (hospital acts as collector)
        
        if (req.body.donorId) {
          // Existing donor case
          const donor = await userModel.findById(req.body.donorId);
          if (!donor || donor.role !== "donar") {
            return res.status(400).send({
              success: false,
              message: "Invalid donor selected"
            });
          }
          req.body.donar = donor._id;
          req.body.email = donor.email; // Use donor's email for inventory record
        } else if (req.body.isNewDonor || req.body.donorName) {
          // New donor case - create donor first
          if (!req.body.donorName || !req.body.donorEmail || !req.body.bloodGroup) {
            return res.status(400).send({
              success: false,
              message: "Donor name, email, and blood group are required for new donors"
            });
          }

          // Check if email already exists
          const existingUser = await userModel.findOne({ email: req.body.donorEmail });
          if (existingUser) {
            return res.status(400).send({
              success: false,
              message: "A user with this email already exists"
            });
          }

          // Ensure all required fields are provided with defaults if missing
          const newDonor = new userModel({
            role: "donar",
            name: req.body.donorName,
            email: req.body.donorEmail,
            phone: req.body.donorPhone || "000-000-0000", // Default phone if not provided
            bloodGroup: req.body.bloodGroup,
            password: "defaultPassword123", // Default password - donor should change later
            address: req.body.donorAddress || "Address not provided", // Default address if not provided
            // Optional fields with safe defaults
            dateOfBirth: req.body.donorDateOfBirth || null,
            gender: req.body.donorGender || null,
            weight: req.body.donorWeight || null,
            isEligible: true,
            healthConditions: {
              diabetes: false,
              hypertension: false,
              heartDisease: false,
              anemia: false,
              other: ""
            }
          });
          
          const savedDonor = await newDonor.save();
          req.body.donar = savedDonor._id;
          req.body.email = req.body.donorEmail;
        } else {
          console.log("🔄 Creating anonymous donor for hospital collection...");
          // Hospital collecting blood without specific donor (emergency/general collection)
          // Create a generic donor record for tracking purposes
          const hospitalName = user.hospitalName || `Hospital ${user._id}`;
          const genericDonorEmail = `anonymous-donor-${Date.now()}@${user.email.split('@')[1]}`;
          
          const anonymousDonor = new userModel({
            role: "donar",
            name: `Anonymous Donor via ${hospitalName}`,
            email: genericDonorEmail,
            phone: user.phone || "000-000-0000",
            bloodGroup: req.body.bloodGroup, // Use the blood group from the request
            password: "defaultPassword123",
            address: user.address || "Address via hospital collection",
            isEligible: true,
            healthConditions: {
              diabetes: false,
              hypertension: false,
              heartDisease: false,
              anemia: false,
              other: "Collected via hospital - health screening completed"
            }
          });
          
          const savedAnonymousDonor = await anonymousDonor.save();
          req.body.donar = savedAnonymousDonor._id;
          req.body.email = genericDonorEmail;
        }
        req.body.collectedBy = user._id; // Track which hospital collected it
        
        // For hospitals, we need to assign them to an organization
        // Find the first available organization or use the hospital as organization
        if (!req.body.organisation) {
          const availableOrg = await userModel.findOne({ role: "organisation" });
          if (availableOrg) {
            req.body.organisation = availableOrg._id;
          } else {
            // If no organizations exist, use the hospital's ID
            req.body.organisation = user._id;
          }
        }
      } else {
        // For regular donors
        req.body.donar = user._id;
        req.body.email = email;
      }
    }

    // Add organization to request body (only if not already set)
    if (!req.body.organisation) {
      req.body.organisation = userId;
    }

    // Save record
    const inventory = new inventoryModel(req.body);
    await inventory.save();

    return res.status(201).send({
      success: true,
      message: "New Blood Record Added Successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error in Create Inventory API",
      error,
    });
  }
};

// GET ALL BLOOD RECORDS
const getInventoryController = async (req, res) => {
  try {
    if (!req.body.userId || !mongoose.isValidObjectId(req.body.userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid or missing user ID",
      });
    }

    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    let inventory = [];

    if (user.role === "organisation") {
      // Organizations see their own inventory
      inventory = await inventoryModel
        .find({ organisation: req.body.userId })
        .populate("donar")
        .populate("hospital")
        .sort({ createdAt: -1 });
    } else if (user.role === "hospital") {
      // Hospitals see their own requests and available blood from all organizations
      inventory = await inventoryModel
        .find({ 
          $or: [
            { hospital: req.body.userId }, // Their own requests
            { inventoryType: "in" } // All available blood
          ]
        })
        .populate("donar")
        .populate("hospital")
        .populate("organisation")
        .sort({ createdAt: -1 });
    } else if (user.role === "donar") {
      // Donors see their own donations
      inventory = await inventoryModel
        .find({ donar: req.body.userId })
        .populate("donar")
        .populate("hospital")
        .populate("organisation")
        .sort({ createdAt: -1 });
    } else if (user.role === "admin") {
      // Admins see all inventory
      inventory = await inventoryModel
        .find({})
        .populate("donar")
        .populate("hospital")
        .populate("organisation")
        .sort({ createdAt: -1 });
    }

    return res.status(200).send({
      success: true,
      message: "Get all records successfully",
      inventory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error in Get All Inventory",
      error,
    });
  }
};

// GET DONOR RECORDS
const getDonarsController = async (req, res) => {
  try {
    if (!req.body.userId || !mongoose.isValidObjectId(req.body.userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid or missing user ID",
      });
    }

    const donorId = await inventoryModel.distinct("donar", {
      organisation: req.body.userId,
    });

    const donars = await userModel.find({ _id: { $in: donorId } });

    return res.status(200).send({
      success: true,
      message: "Donor Records Fetched Successfully",
      donars,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error in Donor Records",
      error,
    });
  }
};

// GET HOSPITAL RECORDS
const getHospitalController = async (req, res) => {
  try {
    if (!req.body.userId || !mongoose.isValidObjectId(req.body.userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid or missing user ID",
      });
    }

    // Get hospital IDs
    const hospitalId = await inventoryModel.distinct("hospital", {
      organisation: req.body.userId,
    });

    // Find hospitals
    const hospitals = await userModel.find({
      _id: { $in: hospitalId },
    });

    return res.status(200).send({
      success: true,
      message: "Hospitals Data Fetched Successfully",
      hospitals,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error in Get Hospital API",
      error,
    });
  }
};

// GET ALL DONORS FOR BLOOD COLLECTION
const getAllDonorsController = async (req, res) => {
  try {
    // Get all users with role 'donar'
    const donors = await userModel.find({ role: "donar" })
      .select("name email phone bloodGroup address")
      .sort({ name: 1 });

    return res.status(200).send({
      success: true,
      message: "All Donors Fetched Successfully",
      donors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error in Get All Donors API",
      error,
    });
  }
};

module.exports = {
  createInventoryController,
  getInventoryController,
  getDonarsController,
  getHospitalController,
  getAllDonorsController,
};
