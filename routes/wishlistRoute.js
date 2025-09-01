import { Router } from "express";
import Wishlist from "../models/Wishlist.js";



const wishlistRoute = Router();

// Add product to wishlist
wishlistRoute.post("/add", authMiddleware, async (req, res) => {
    console.log(req.body,req.user.id)
  try {
    const { productId } = req.body;
    const userId = req.user.id;
   
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    if (wishlist.products.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    wishlist.products.push(productId);
    await wishlist.save();

    res.json({ message: "Product added to wishlist", wishlist });
  } catch (err) {
    res.status(500).json({ message: "Error adding to wishlist", err });
  }
});

//  Remove product from wishlist
import mongoose from "mongoose";
import authMiddleware from "../middlewares/authMiddleware.js";

wishlistRoute.delete("/remove/:productId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    console.log("Removing product:", productId, "for user:", userId);

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    // remove null entries
    wishlist.products = wishlist.products.filter((id) => id != null);

    // remove matching product
    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId.toString()
    );

    await wishlist.save();
    res.json({ message: "Product removed from wishlist", wishlist });
  } catch (err) {
    console.error("Wishlist Remove Error:", err);
    res.status(500).json({ message: "Error removing product", err });
  }
});



// Get user wishlist
wishlistRoute.get("/get", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

   
    const wishlist = await Wishlist.findOne({ user: userId }).populate("products");

    if (!wishlist) {
      return res.json({ products: [] });
    }

    res.json(wishlist.products); 
  } catch (err) {
    res.status(500).json({ message: "Error fetching wishlist", err });
  }
});


export default wishlistRoute;
