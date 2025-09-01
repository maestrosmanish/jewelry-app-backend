// utils/registerUser.js

import User from "../models/User.js";


export const registerUserHelper = async ({ fullName, email, password, phone, address, role="user" }) => {
  // Check email exist
  const userExist = await User.findOne({ email });
  if (userExist) {
    throw new Error("Email already registered");
  }

  // Check phone exist
  const phoneExist = await User.findOne({ phone });
  if (phoneExist) {
    throw new Error("Phone number already registered");
  }

  // New user create
  const user = new User({
    fullName,
    email,
    phone,
    password,
    address,
    role,
  });

  await user.save();

  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
  };
};
