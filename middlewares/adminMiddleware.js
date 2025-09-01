import User from "../models/User.js";

const adminMiddleware = async (req, res, next) => {
  console.log("adminMiddleware");
 console.log(req.user.id)
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized, user not found" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      next();
    } else {
      res.status(403).json({ message: "Access denied. Admin only." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default adminMiddleware;

