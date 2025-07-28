const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const { 
  handleValidationErrors 
} = require('../middleware/validationMiddleware');
const {
  createBloodRequestController,
  getBloodRequestsController,
  getAllBloodRequestsController,
  updateBloodRequestController,
  fulfillBloodRequestController,
  getUrgentRequestsController
} = require('../controllers/bloodRequestController');

const router = express.Router();

// Create blood request validation
const validateBloodRequest = [
  body('bloodGroup').isIn(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']).withMessage('Invalid blood group'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('purpose').isIn(['surgery', 'emergency', 'treatment', 'research', 'other']).withMessage('Invalid purpose'),
  body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),
  body('requiredBy').isISO8601().withMessage('Invalid required by date'),
  body('contactPerson.name').trim().isLength({ min: 2 }).withMessage('Contact person name is required'),
  body('contactPerson.phone').isMobilePhone().withMessage('Valid contact phone is required'),
  body('contactPerson.email').optional().isEmail().withMessage('Invalid contact email'),
  body('patientInfo.age').optional().isInt({ min: 0, max: 150 }).withMessage('Invalid patient age'),
  body('patientInfo.gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Invalid estimated cost')
];

// Blood request routes
router.post('/create', 
  authMiddleware, 
  apiLimiter, 
  validateBloodRequest, 
  handleValidationErrors, 
  createBloodRequestController
);

router.get('/my-requests', 
  authMiddleware, 
  apiLimiter, 
  getBloodRequestsController
);

router.get('/all', 
  authMiddleware, 
  apiLimiter, 
  getAllBloodRequestsController
);

router.get('/urgent', 
  authMiddleware, 
  apiLimiter, 
  getUrgentRequestsController
);

router.put('/update/:requestId', 
  authMiddleware, 
  apiLimiter, 
  updateBloodRequestController
);

router.post('/fulfill/:requestId', 
  authMiddleware, 
  apiLimiter, 
  fulfillBloodRequestController
);

module.exports = router;
