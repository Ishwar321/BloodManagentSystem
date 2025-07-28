const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, "role is required"],
      enum: ["admin", "organisation", "donar", "hospital"],
    },
    name: {
      type: String,
      required: function () {
        if (this.role === "donar" || this.role === "admin") {
          return true;
        }
        return false;
      },
    },
    organisationName: {
      type: String,
      required: function () {
        if (this.role === "organisation") {
          return true;
        }
        return false;
      },
    },
    hospitalName: {
      type: String,
      required: function () {
        if (this.role === "hospital") {
          return true;
        }
        return false;
      },
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    website: {
      type: String,
    },
    address: {
      type: String,
      required: [true, "address is required"],
    },
    phone: {
      type: String,
      required: [true, "phone number is required"],
    },
    // Enhanced fields for donors
    dateOfBirth: {
      type: Date,
      required: false, // Allow donors to complete profile later
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false, // Allow donors to complete profile later
    },
    bloodGroup: {
      type: String,
      enum: ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"],
      required: false, // Allow donors to complete profile later
    },
    weight: {
      type: Number,
      min: 45,
      required: false, // Allow donors to complete profile later
    },
    lastDonationDate: {
      type: Date,
    },
    isEligible: {
      type: Boolean,
      default: true,
    },
    healthConditions: {
      diabetes: { type: Boolean, default: false },
      hypertension: { type: Boolean, default: false },
      heartDisease: { type: Boolean, default: false },
      anemia: { type: Boolean, default: false },
      other: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    // Enhanced fields for hospitals
    licenseNumber: {
      type: String,
      required: function() {
        return this.role === "hospital";
      },
    },
    establishedYear: Number,
    bedCapacity: Number,
    bloodBankLicense: String,
    // Enhanced fields for organizations
    registrationNumber: {
      type: String,
      required: function() {
        return this.role === "organisation";
      },
    },
    organizationType: {
      type: String,
      enum: ["ngo", "government", "private", "trust"],
      required: function() {
        return this.role === "organisation";
      },
    },
    // Common verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "under_review"],
      default: "pending",
    },
    verificationDocuments: [{
      documentType: String,
      documentUrl: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    profileCompleteness: {
      type: Number,
      default: 0,
    },
    location: {
      city: String,
      state: String,
      pincode: String,
      latitude: Number,
      longitude: Number,
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true },
      donationReminders: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate profile completeness
userSchema.pre('save', function(next) {
  let completeness = 0;
  const requiredFields = ['name', 'email', 'phone', 'address'];
  
  // Add role-specific required fields for completeness calculation
  if (this.role === 'donar') {
    // For donors, these fields contribute to profile completeness but aren't required for registration
    const optionalDonorFields = ['dateOfBirth', 'gender', 'bloodGroup', 'weight'];
    requiredFields.push(...optionalDonorFields);
  } else if (this.role === 'hospital') {
    requiredFields.push('hospitalName', 'licenseNumber');
  } else if (this.role === 'organisation') {
    requiredFields.push('organisationName', 'registrationNumber', 'organizationType');
  }
  
  const filledFields = requiredFields.filter(field => {
    if (field === 'name') {
      return this.name || this.hospitalName || this.organisationName;
    }
    return this[field];
  }).length;
  
  this.profileCompleteness = Math.round((filledFields / requiredFields.length) * 100);
  next();
});

module.exports = mongoose.model("users", userSchema);
