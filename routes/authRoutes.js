const express = require('express')
const { registerController, loginController, currentUserCotroller, getUsersByRoleController } = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()

//routes
//REGISTER || POST
router.post('/register', registerController)

//LOGIN || POST
router.post('/login', loginController)

//GET CURRENT USER || POST
router.get('/current-user', authMiddleware, currentUserCotroller)

//GET USERS BY ROLE || GET
router.get('/users', authMiddleware, getUsersByRoleController)

module.exports = router