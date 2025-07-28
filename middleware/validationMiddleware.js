const { body, validationResult } = require('express-validator');

// Common validation rules
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('address').trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
];

const validateDonor = [
  ...validateUser,
  body('bloodGroup').isIn(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']).withMessage('Invalid blood group'),
  body('age').isInt({ min: 18, max: 65 }).withMessage('Age must be between 18 and 65'),
];

const validateHospital = [
  ...validateUser,
  body('hospitalName').trim().isLength({ min: 2 }).withMessage('Hospital name is required'),
  body('licenseNumber').trim().isLength({ min: 3 }).withMessage('License number is required'),
  body('website').optional().isURL().withMessage('Please provide a valid website URL'),
];

const validateOrganisation = [
  ...validateUser,
  body('organisationName').trim().isLength({ min: 2 }).withMessage('Organisation name is required'),
  body('organizationType').isIn(['ngo', 'government', 'private', 'trust']).withMessage('Invalid organization type'),
  body('registrationNumber').trim().isLength({ min: 3 }).withMessage('Registration number is required'),
  body('website').optional().isURL().withMessage('Please provide a valid website URL'),
];

const validateInventory = [
  body('inventoryType').isIn(['in', 'out']).withMessage('Invalid inventory type'),
  body('bloodGroup').isIn(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']).withMessage('Invalid blood group'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('donar').optional().isMongoId().withMessage('Invalid donor ID'),
  body('hospital').optional().isMongoId().withMessage('Invalid hospital ID'),
];

const validateCampaign = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('targetAudience').trim().isLength({ min: 3 }).withMessage('Target audience is required'),
];

const validateEvent = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('date').isISO8601().withMessage('Invalid date'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('expectedAttendees').isInt({ min: 1 }).withMessage('Expected attendees must be at least 1'),
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateUser,
  validateDonor,
  validateHospital,
  validateOrganisation,
  validateInventory,
  validateCampaign,
  validateEvent,
  handleValidationErrors
};
