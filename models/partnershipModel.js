const mongoose = require("mongoose");

const partnershipSchema = new mongoose.Schema(
  {
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    type: {
      type: String,
      enum: ["blood_collection", "awareness_collaboration", "event_hosting", "resource_sharing", "full_partnership"],
      default: "blood_collection",
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "terminated", "under_review"],
      default: "pending",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    terms: {
      bloodQuotaPerMonth: Number, // Expected blood collection per month
      eventFrequency: String, // How often events are conducted
      resourceSharing: [String], // What resources are shared
      responsibilities: {
        organisation: [String],
        hospital: [String],
      },
    },
    performance: {
      eventsConnected: { type: Number, default: 0 },
      totalBloodFacilitated: { type: Number, default: 0 }, // in ML
      donorsReferred: { type: Number, default: 0 },
      averageEventSize: { type: Number, default: 0 },
      satisfactionRating: { type: Number, min: 1, max: 5 },
    },
    contactPersons: {
      organisation: {
        name: String,
        email: String,
        phone: String,
        position: String,
      },
      hospital: {
        name: String,
        email: String,
        phone: String,
        position: String,
      },
    },
    agreements: [{
      title: String,
      description: String,
      signedDate: Date,
      documentUrl: String,
    }],
    notes: String,
  },
  { timestamps: true }
);

// Index for better query performance
partnershipSchema.index({ organisation: 1, status: 1 });
partnershipSchema.index({ hospital: 1, status: 1 });
partnershipSchema.index({ organisation: 1, hospital: 1 }, { unique: true });

module.exports = mongoose.model("partnerships", partnershipSchema);
