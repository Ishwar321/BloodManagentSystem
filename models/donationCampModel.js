const mongoose = require("mongoose");

const donationCampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Camp name is required"],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Organizer is required"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    location: {
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
      },
      latitude: Number,
      longitude: Number,
    },
    date: {
      type: Date,
      required: [true, "Camp date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    registeredDonors: [{
      donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      registrationDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["registered", "attended", "no_show"],
        default: "registered",
      },
    }],
    requirements: [{
      bloodGroup: {
        type: String,
        enum: ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"],
      },
      targetQuantity: Number,
      collectedQuantity: {
        type: Number,
        default: 0,
      },
    }],
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    totalCollected: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    contactInfo: {
      phone: String,
      email: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DonationCamp", donationCampSchema);
