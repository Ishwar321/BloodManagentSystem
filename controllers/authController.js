const userModel = require("../models/userModel");
const bcryptjs = require('bcryptjs'); // ✅ Use consistent bcryptjs
const { request } = require("express");
const jwt = require('jsonwebtoken');

const registerController = async(req,res) => {
    try {
        console.log("Registration request received:", req.body);
        
        // Validate required fields
        const { email, password, role, address, phone } = req.body;
        
        if (!email || !password || !role || !address || !phone) {
            return res.status(400).send({
                success: false,
                message: 'Please provide all required fields: email, password, role, address, phone'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).send({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Validate role-specific required fields
        if (role === 'donar' || role === 'admin') {
            if (!req.body.name) {
                return res.status(400).send({
                    success: false,
                    message: 'Name is required for donors and admins'
                });
            }
        }

        if (role === 'organisation') {
            if (!req.body.organisationName || !req.body.registrationNumber || !req.body.organizationType) {
                return res.status(400).send({
                    success: false,
                    message: 'Organisation name, registration number, and organization type are required for organisations'
                });
            }
            
            // Validate organization type
            const validOrgTypes = ['ngo', 'government', 'private', 'trust'];
            if (!validOrgTypes.includes(req.body.organizationType)) {
                return res.status(400).send({
                    success: false,
                    message: 'Invalid organization type. Must be one of: ngo, government, private, trust'
                });
            }
        }

        if (role === 'hospital') {
            if (!req.body.hospitalName || !req.body.licenseNumber) {
                return res.status(400).send({
                    success: false,
                    message: 'Hospital name and license number are required for hospitals'
                });
            }
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({email: req.body.email})
        if(existingUser){
            return res.status(400).send({
                success:false,
                message:'User already exists with this email address'
            })
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(req.body.password,salt)
        
        // Prepare user data by cleaning empty strings for role-specific fields
        const userData = {
            ...req.body,
            password: hashedPassword,
            isActive: true,
            verificationStatus: 'pending'
        };

        // Clean role-specific fields - remove empty strings to avoid validation errors
        if (role !== 'donar' && role !== 'admin') {
            if (userData.name === '') delete userData.name;
        }
        if (role !== 'organisation') {
            if (userData.organisationName === '') delete userData.organisationName;
            if (userData.registrationNumber === '') delete userData.registrationNumber;
            if (userData.organizationType === '') delete userData.organizationType;
        }
        if (role !== 'hospital') {
            if (userData.hospitalName === '') delete userData.hospitalName;
            if (userData.licenseNumber === '') delete userData.licenseNumber;
            if (userData.website === '') delete userData.website;
        }

        // Create user
        const user = new userModel(userData);
        await user.save();
        
        // Remove password from response
        const { password: _, ...userResponse } = user.toObject();
        
        console.log("User registered successfully:", userResponse);
        
        return res.status(201).send({
            success:true,
            message:'User registered successfully',
            user: userResponse,
        })
    } catch (error) {
        console.log("Registration error:", error)
        
        // Handle specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).send({
                success: false,
                message: 'Validation error',
                error: validationErrors.join(', ')
            });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).send({
                success: false,
                message: 'User already exists with this email address'
            });
        }
        
        res.status(500).send({
            success:false,
            message:'Error in register API',
            error: error.message
        })
    }
};

//login call back
const loginController = async(req,res) => {
    try {
        console.log("Login attempt:", { email: req.body.email, role: req.body.role });
        
        // Validate input
        if (!req.body.email || !req.body.password || !req.body.role) {
            return res.status(400).send({
                success: false,
                message: 'Please provide email, password, and role'
            });
        }

        // Find user by email (case-insensitive)
        const user = await userModel.findOne({
            email: { $regex: new RegExp('^' + req.body.email + '$', 'i') }
        });
        
        if(!user){
            console.log("User not found:", req.body.email);
            return res.status(404).send({
                success:false,
                message:'User not found with this email address'
            })
        }

        console.log("User found:", { email: user.email, role: user.role });
        
        //check role
        if(user.role !== req.body.role){
            console.log("Role mismatch:", { userRole: user.role, requestedRole: req.body.role });
            return res.status(400).send({
                success: false,
                message: `Account exists as ${user.role}, not ${req.body.role}. Please select the correct role.`,
            });
        }
        
        //compare password
        const comparePassword = await bcryptjs.compare(req.body.password, user.password)
        if(!comparePassword){
            console.log("Password mismatch for user:", user.email);
            return res.status(401).send({
                success:false,
                message:'Invalid password'
            });
        }

        // Check if JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET not found in environment variables");
            return res.status(500).send({
                success: false,
                message: 'Server configuration error'
            });
        }

        const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:'1d'})
        
        // Remove password from user object before sending
        const { password, ...userResponse } = user.toObject();
        
        console.log("Login successful for:", user.email);
        
        return res.status(200).send({
            success:true,
            message:'Login Successfully',
            token,
            user: userResponse,
        });
    } catch (error) {
        console.log("Login error:", error)
        res.status(500).send({
            success:false,
            message:'Error In Login API',
            error: error.message
        })
    }
};


//GET CURRENT USER
const currentUserCotroller = async (req,res) => {
    try {
        const user = await userModel.findOne({_id:req.body.userId})
        return res.status(201).send({
            success:true,
            message:'User Fetched Successfully',
            user,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success:false,
            message:'unable to get current user',
            error
        })
    }
};

//GET USERS BY ROLE
const getUsersByRoleController = async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};
        
        if (role) {
            query.role = role;
        }
        
        const users = await userModel.find(query).select('-password');
        
        return res.status(200).send({
            success: true,
            message: `Users fetched successfully`,
            users,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error fetching users',
            error
        });
    }
};

module.exports = { registerController, loginController, currentUserCotroller, getUsersByRoleController };;