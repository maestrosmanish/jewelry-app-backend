import express from "express";
import Order from "../models/Orders.js";
import Cartitems from "../models/Cartitems.js";
import { Router } from "express";
import Product from "../models/Product.js"; // Import Product model
import authMiddleware from "../middlewares/authMiddleware.js";

const orderRoute = Router();

// Get all orders (Admin only)
orderRoute.get('/admin/orders', authMiddleware, async (req, res) => { 

  try {
    //  if (req.user.role !== 'admin') return res.status(403).json({ message: "Not authorized" });

    const orders = await Order.find()
      .populate('user', 'name email') // user details
      .populate('products.product', 'name brand images price discount') // product details
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All orders fetched successfully!",
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error("Admin orders fetching error:", error);
    res.status(500).json({
      message: "Error fetching admin orders",
      error: error.message
    });
  }
});


// Create new order
orderRoute.post("/order/post", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { address, paymentMethod } = req.body;

    let cart = await Cartitems.findOne({ user: userId }).populate({
      path: "products.product",
      select: "name brand metalType purity weight size price discount",
    });

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    //  Convert cart items → order snapshot
    const orderProducts = cart.products.map((item) => {
      const p = item.product;
      return {
        product: p._id,
        name: p.name,
        brand: p.brand,
        metalType: p.metalType,
        purity: p.purity,
        weight: p.weight,
        size: p.size,
        price: item.price,
        discount: item.discount,
        quantity: item.quantity,
        discountedPrice: item.discountedPrice,
      };
    });

 
    const order = new Order({
      user: userId,
      products: orderProducts,
      address,
      paymentMethod,
    });

    
    await order.save();

    cart.products = [];
    cart.totalPrice = 0;
    cart.totalDiscount = 0;
    await cart.save();

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Order creation failed",
      error: error.message,
    });
  }
});

// Get all orders for user
orderRoute.get('/order/get', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const orders = await Order.find({ user: userId })
      .populate('user', 'name email')
      .populate('products.product', 'name brand images metalType')
      .sort({ createdAt: -1 }); // Latest orders first

    res.status(200).json(orders);

  } catch (error) {
    console.error("Orders fetching error:", error);
    res.status(500).json({
      message: "Error fetching orders!",
      error: error.message
    });
  }
});

// Get single order 
orderRoute.get('/order/:id', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    
    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate('user', 'name email')
      .populate('products.product', 'name brand images metalType weight size');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);

  } catch (error) {
    console.error("Order fetching error:", error);
    res.status(500).json({
      message: "Error fetching order!",
      error: error.message
    });
  }
});

// Update order
orderRoute.put("/order/update/:id", authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, paymentStatus, paymentMethod, address } = req.body;

    // Validate status values
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"];
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
    const validPaymentMethods = ["COD", "UPI", "Card", "NetBanking"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status value" });
    }

    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(paymentMethod && { paymentMethod }),
        ...(address && { address })
      },
      { new: true, runValidators: true }
    )
    .populate('user', 'name email')
    .populate('products.product', 'name brand images');

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order updated successfully!",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({
      message: "Error updating order",
      error: error.message
    });
  }
});


// Cancel order 
orderRoute.put("/order/cancel/:id", authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    // Only cancel if order belongs to user and status is pending/processing
    const order = await Order.findOneAndUpdate(
      { _id: orderId, user: userId, status: { $in: ["pending", "processing"] } },
      {
        $set: {
          status: "cancelled",
          paymentStatus: "refunded", // agar paid tha to refunded kar do
        },
      },
      { new: true }
    )
      .populate("user", "name email")
      .populate("products.product", "name brand images");

    if (!order) {
      return res.status(404).json({
        message: "Order not found or cannot be cancelled",
      });
    }

    res.status(200).json({
      message: "Order cancelled successfully!",
      order,
    });
  } catch (error) {
    console.error("Order cancellation error:", error);
    res.status(500).json({
      message: "Error cancelling order",
      error: error.message,
    });
  }
});

export default orderRoute;