import jwt from "jsonwebtoken";
import dotenv from 'dotenv'
dotenv.config();

const authMiddleware = (req, res, next) => { 
  console.log("Auth middleware");
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
