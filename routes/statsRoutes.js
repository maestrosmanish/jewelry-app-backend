import express from "express";
import User from "../models/User.js";
import Orders from "../models/Orders.js";
import Product from "../models/Product.js";

const statusRouter = express.Router();

// Get total counts + status wise counts + revenue + sales + recent orders
statusRouter.get("/stats", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const orderCount = await Orders.countDocuments();
    const productCount = await Product.countDocuments();

    // Status wise counts
    const processing = await Orders.countDocuments({ status: "processing" });
    const shipped = await Orders.countDocuments({ status: "shipped" });
    const delivered = await Orders.countDocuments({ status: "delivered" });
    const cancelled = await Orders.countDocuments({ status: "cancelled" });

    // Revenue & Sales (sirf delivered orders ke hisaab se)
    const deliveredOrders = await Orders.find({ status: "delivered" });

    let totalRevenue = 0;
    deliveredOrders.forEach(order => {
      totalRevenue += order.totalPrice;
    });

    const totalSales = deliveredOrders.length; // delivered orders ka count

    // Recent 5 Orders
    const recentOrders = await Orders.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "fullName email")   // User info laane ke liye
      .populate("products.product", "name price"); // Product info laane ke liye

    res.json({
      success: true,
      userCount,
      orderCount,
      productCount,
      totalRevenue,
      totalSales,
      status: {
        processing,
        shipped,
        delivered,
        cancelled,
      },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
      error: error.message,
    });
  }
});

export default statusRouter;
