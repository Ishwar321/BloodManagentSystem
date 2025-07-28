const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

//dot config
dotenv.config();

//rest object
const app = express();

//cors
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
}));

//middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan("dev"));

//routes
// Core routes
app.use("/api/v1/test", require("./routes/testRoutes"));
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/inventory", require("./routes/inventoryRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use("/api/v1/notifications", require("./routes/notificationRoutes"));
app.use("/api/v1/analytics", require("./routes/analyticsRoutes"));

// Add back essential routes
app.use("/api/v1/camps", require("./routes/donationCampRoutes"));

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    status: 'OK'
  });
});

// Test data creation endpoint (for development only)
app.get('/api/v1/test/create-sample-data', async (req, res) => {
  try {
    const inventoryModel = require('./models/inventoryModel');
    const userModel = require('./models/userModel');
    const bcryptjs = require('bcryptjs');
    
    // Create a sample organization if it doesn't exist
    let sampleOrg = await userModel.findOne({ email: 'sampleorg@test.com' });
    if (!sampleOrg) {
      const hashedPassword = await bcryptjs.hash('password123', 10);
      sampleOrg = new userModel({
        name: 'Sample Organization',
        role: 'organisation',
        email: 'sampleorg@test.com',
        password: hashedPassword,
        organisationName: 'Sample Blood Bank',
        address: 'Sample Address',
        phone: '1234567890',
        organizationType: 'ngo'
      });
      await sampleOrg.save();
    }

    // Create sample hospitals
    const hospitals = [
      {
        name: 'City General Hospital',
        email: 'citygeneral@test.com',
        hospitalName: 'City General Hospital',
        address: '123 Medical Center Blvd',
        phone: '9876543210'
      },
      {
        name: 'Metro Health Hospital',
        email: 'metrohealth@test.com',
        hospitalName: 'Metro Health Hospital',
        address: '456 Healthcare Ave',
        phone: '9876543211'
      }
    ];

    for (let hospitalData of hospitals) {
      const existing = await userModel.findOne({ email: hospitalData.email });
      if (!existing) {
        const hashedPassword = await bcryptjs.hash('password123', 10);
        await userModel.create({
          ...hospitalData,
          role: 'hospital',
          password: hashedPassword
        });
      }
    }

    // Create sample donors
    const donors = [
      {
        name: 'John Smith',
        email: 'john.smith@test.com',
        phone: '5551234567',
        address: '789 Donor Street'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@test.com',
        phone: '5551234568',
        address: '321 Helper Ave'
      },
      {
        name: 'Mike Wilson',
        email: 'mike.wilson@test.com',
        phone: '5551234569',
        address: '654 Kindness Blvd'
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@test.com',
        phone: '5551234570',
        address: '987 Charity Lane'
      },
      {
        name: 'David Brown',
        email: 'david.brown@test.com',
        phone: '5551234571',
        address: '147 Volunteer Road'
      }
    ];

    const createdDonors = [];
    for (let donorData of donors) {
      let donor = await userModel.findOne({ email: donorData.email });
      if (!donor) {
        const hashedPassword = await bcryptjs.hash('password123', 10);
        donor = await userModel.create({
          ...donorData,
          role: 'donar',
          password: hashedPassword
        });
      }
      createdDonors.push(donor);
    }

    // Create sample inventory data with proper donor relationships
    const bloodGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];
    
    for (let i = 0; i < createdDonors.length; i++) {
      const donor = createdDonors[i];
      const bloodGroup = bloodGroups[i % bloodGroups.length];
      
      // Check if inventory record already exists for this donor
      const existing = await inventoryModel.findOne({ 
        donar: donor._id,
        organisation: sampleOrg._id 
      });
      
      if (!existing) {
        await inventoryModel.create({
          inventoryType: 'in',
          bloodGroup: bloodGroup,
          quantity: Math.floor(Math.random() * 5) + 1, // Random quantity between 1-5
          email: donor.email,
          organisation: sampleOrg._id,
          donar: donor._id
        });
      }
    }

    // Get counts for response
    const donorCount = await userModel.countDocuments({ role: 'donar' });
    const hospitalCount = await userModel.countDocuments({ role: 'hospital' });
    const inventoryCount = await inventoryModel.countDocuments();

    res.json({
      success: true,
      message: 'Comprehensive sample data created successfully',
      data: {
        organizationId: sampleOrg._id,
        donorsCreated: donorCount,
        hospitalsCreated: hospitalCount,
        inventoryRecordsCreated: inventoryCount
      }
    });
  } catch (error) {
    console.error('Sample data creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sample data',
      error: error.message
    });
  }
});

// Optional routes - add back gradually if needed
// app.use("/api/v1/requests", require("./routes/requestRoutes"));
// app.use("/api/v1/blood-requests", require("./routes/bloodRequestRoutes"));
app.use("/api/v1/organization", require("./routes/organizationRoutes"));

// Static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, './client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

//port
const PORT = process.env.PORT || 8080;

//mongodb connection
connectDB();

//listen
app.listen(PORT, () => {
  console.log(
    `Node Server Running in ${process.env.DEV_MODE || 'development'} Mode On Port ${PORT}`.bgWhite.red
  );
});
