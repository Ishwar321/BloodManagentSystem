const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Blood request model for hospitals
const bloodRequestSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  purpose: {
    type: String,
    required: true,
    enum: ['surgery', 'emergency', 'treatment', 'research', 'other']
  },
  description: {
    type: String,
    maxlength: 500
  },
  requiredBy: {
    type: Date,
    required: true
  },
  patientInfo: {
    age: { type: Number, min: 0 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    condition: { type: String, maxlength: 200 }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'fulfilled', 'partially_fulfilled', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  fulfilledBy: [{
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    quantity: { type: Number, min: 1 },
    date: { type: Date, default: Date.now }
  }],
  rejectionReason: {
    type: String,
    maxlength: 200
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  contactPerson: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['info', 'warning', 'error'], default: 'info' }
  }],
  metadata: {
    sourceIP: String,
    userAgent: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bloodRequestSchema.index({ hospital: 1, status: 1 });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ urgency: 1, requiredBy: 1 });
bloodRequestSchema.index({ createdAt: -1 });
bloodRequestSchema.index({ status: 1, priority: -1 });

// Middleware to calculate priority based on urgency and time
bloodRequestSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('urgency') || this.isModified('requiredBy')) {
    const urgencyPoints = {
      'critical': 10,
      'high': 8,
      'medium': 5,
      'low': 3
    };
    
    const timePoints = this.requiredBy ? 
      Math.max(1, Math.min(5, Math.ceil((this.requiredBy - new Date()) / (1000 * 60 * 60 * 24)))) : 3;
    
    this.priority = Math.min(10, urgencyPoints[this.urgency] + (6 - timePoints));
  }
  next();
});

// Virtual for days until required
bloodRequestSchema.virtual('daysUntilRequired').get(function() {
  if (!this.requiredBy) return null;
  const diffTime = this.requiredBy - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for fulfillment percentage
bloodRequestSchema.virtual('fulfillmentPercentage').get(function() {
  if (!this.fulfilledBy || this.fulfilledBy.length === 0) return 0;
  const fulfilledQuantity = this.fulfilledBy.reduce((sum, fulfillment) => sum + fulfillment.quantity, 0);
  return Math.min(100, (fulfilledQuantity / this.quantity) * 100);
});

// Methods
bloodRequestSchema.methods.canFulfill = function(availableQuantity) {
  return availableQuantity >= this.quantity && this.status === 'pending';
};

bloodRequestSchema.methods.addNote = function(authorId, message, type = 'info') {
  this.notes.push({
    author: authorId,
    message: message,
    type: type,
    timestamp: new Date()
  });
  return this.save();
};

bloodRequestSchema.methods.fulfill = function(organisationId, quantity) {
  const remainingQuantity = this.quantity - this.fulfilledBy.reduce((sum, f) => sum + f.quantity, 0);
  const fulfillQuantity = Math.min(quantity, remainingQuantity);
  
  this.fulfilledBy.push({
    organisation: organisationId,
    quantity: fulfillQuantity,
    date: new Date()
  });
  
  const totalFulfilled = this.fulfilledBy.reduce((sum, f) => sum + f.quantity, 0);
  
  if (totalFulfilled >= this.quantity) {
    this.status = 'fulfilled';
  } else {
    this.status = 'partially_fulfilled';
  }
  
  return this.save();
};

// Statics
bloodRequestSchema.statics.findUrgent = function() {
  return this.find({
    status: { $in: ['pending', 'partially_fulfilled'] },
    urgency: { $in: ['high', 'critical'] },
    requiredBy: { $gte: new Date() }
  }).sort({ priority: -1, requiredBy: 1 });
};

bloodRequestSchema.statics.findByBloodGroup = function(bloodGroup) {
  return this.find({
    bloodGroup: bloodGroup,
    status: { $in: ['pending', 'partially_fulfilled'] }
  }).sort({ priority: -1, requiredBy: 1 });
};

bloodRequestSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
};

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);
module.exports = BloodRequest;
