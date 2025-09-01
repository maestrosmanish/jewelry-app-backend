import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js"; 
import { registerUserHelper } from "../utils/registerUser.js";

dotenv.config();

const userRoute = express.Router();


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// add user through admin
userRoute.post("/admin/user/register", authMiddleware, async (req, res) => {
  try {
    const admin = req.user.id;
    console.log("Incoming body:", req.body);

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await registerUserHelper({ ...req.body, role: "user" });

    res
      .status(201)
      .json({ message: "User registered successfully by Admin", user });
  } catch (error) {
 console.log("Backend Error -->", error);

  if (error.code === 11000) {
    // Mongo duplicate key error
    return res.status(400).json({
      message: "Duplicate field value entered",
      field: Object.keys(error.keyValue)[0],
    });
  }


  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  // Generic fallback
  return res.status(500).json({
    message: "Something went wrong",
    error: error.message || error.toString(),
  });
  }
});


//  Normal user self-register
userRoute.post("/user/register", async (req, res) => {
  try {
    const user = await registerUserHelper({ ...req.body, role: "user" });
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// User Login
userRoute.post('/user/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
});

// Get all users (Admin only)
userRoute.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => { 
  console.log('hittt')
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Users fetching error !!", error });
  }
});

// Get user by ID (Admin only)
userRoute.get('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "User fetching error", error });
  }
});

// Update user status (Admin only)
userRoute.put('/admin/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: "Status update error", error });
  }
});

// Update user role (Admin only)
userRoute.put('/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: `User role updated to ${role}`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: "Role update error", error });
  }
});

// Delete user (Admin only)
userRoute.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "User deletion error", error });
  }
});

// Get user profile (Protected)
userRoute.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Profile fetching error", error });
  }
});

export default userRoute;