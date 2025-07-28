const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      required: [true, "Request type is required"],
      enum: ["blood_request", "donation_appointment", "camp_participation"],
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Requester is required"],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: function() {
        return this.requestType === "blood_request" || this.requestType === "donation_appointment";
      },
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "fulfilled", "expired"],
      default: "pending",
    },
    message: {
      type: String,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    patientName: String,
    hospitalName: String,
    contactNumber: String,
    scheduledDate: Date,
    expiryDate: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      },
    },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    adminNotes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
