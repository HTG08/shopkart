const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

// REGISTER
const registerCustomer = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;

        // Check required fields
        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        // Check if email already exists
        const existingCustomer = await Customer.findOne({ email });

        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer
        const customer = await Customer.create({
            fullName,
            email,
            password: hashedPassword,
            phone
        });

        // Never send password back
        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer: {
                _id: customer._id,
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone
            }
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// LOGIN
const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check credentials
        if (!email || !password) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Find customer
        const customer = await Customer.findOne({ email });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Compare password with hash
        const isPasswordCorrect = await bcrypt.compare(
            password,
            customer.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Generate JWT
        const token = generateToken(customer._id);

        // Store JWT in HttpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// GET MY PROFILE
const getMyProfile = async (req, res) => {
    res.status(200).json({
        success: true,
        customer: req.user
    });
};


// LOGOUT
const logoutCustomer = async (req, res) => {
    try {
        res.clearCookie("token");

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    registerCustomer,
    loginCustomer,
    getMyProfile,
    logoutCustomer
};