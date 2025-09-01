import Cartitems from "../models/Cartitems.js";
import { Router } from "express";
import Product from "../models/Product.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const cartRoute = Router();
cartRoute.post('/cart/post', authMiddleware, async (req, res) => {
  try {
    const { quantity, productId } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json("Product not found");
    }

    const discountedPrice = product.price - (product.price * product.discount) / 100;

    let cart = await Cartitems.findOne({ user: userId });

    if (!cart) {
      cart = new Cartitems({ user: userId, products: [] });
    }

    const existingItem = cart.products.find(
      (p) => p.product.toString() === productId
    );

    if (!existingItem && cart.products.length >= 10) {
      return res.status(400).json({
        message: "Cart limit reached! You cannot add more than 10 items.",
      });
    }

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = product.price;
      existingItem.discount = product.discount;
      existingItem.discountedPrice = discountedPrice;
    } else {
      cart.products.push({
        product: productId,
        quantity,
        price: product.price,
        discount: product.discount,
        discountedPrice,
      });
    }

    // Total original price (without discount)
    cart.totalPrice = cart.products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Total discount
    cart.totalDiscount = cart.products.reduce(
      (sum, item) => sum + (item.price - item.discountedPrice) * item.quantity,
      0
    );

    // Final price after discount
    const finalPrice = cart.totalPrice - cart.totalDiscount;

    // Tax (5%)
    const tax = finalPrice * 0.05;

    // Grand total with tax
    const grandTotal = finalPrice + tax;

    await cart.save();

    const populatedCart = await cart.populate({
      path: "products.product",
      select: "name brand price discount images category",
    });

      res.status(200).json({
      message: "Cart updated !!",
       populatedCart
    });
  } catch (error) {
    res.status(500).json({ message: "Add items error", error });
  }
});

cartRoute.get('/cart/get', authMiddleware ,async (req, res) => {
  try {
    const userId  = req.user.id;

    const cart = await Cartitems.findOne({ user: userId })
  .populate({
    path: "products.product",
    select: "name brand price discount images category",
    populate: {
      path: "category",
      select: "name", // get only the category name
    },
  })
  .populate("user", "name email");


    if (!cart || cart.products.length === 0) {
      return res.status(200).json({
        message: "No item yet in cart",
        cart: {
          products: [],
          totalPrice: 0,
          totalDiscount: 0
        }
      });
    }

    res.status(200).json(cart);

  } catch (error) {
    res.status(500).json({ message: "Cart items fetching error !!", error });
  }
});


cartRoute.delete('/cart/delete/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    let cart = await Cartitems.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find product index
    const itemIndex = cart.products.findIndex(p => p.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Remove that product
    cart.products.splice(itemIndex, 1);

    // Recalculate totals
    cart.totalPrice = cart.products.reduce((sum, i) => sum + i.discountedPrice * i.quantity, 0);
    cart.totalDiscount = cart.products.reduce((sum, i) => sum + (i.price - i.discountedPrice) * i.quantity, 0);

    await cart.save();

    const populatedCart = await cart.populate("products.product", "name price discount images category");

    res.status(200).json({ message: "Product removed from cart", cart: populatedCart });

  } catch (error) {
    res.status(500).json({ message: "Error removing product", error });
  }
});

// Get all users carts (Admin only)
cartRoute.get('/admin/carts', async (req, res) => {
  try {
    const carts = await Cartitems.find().populate('user','name email')
      // .populate("user", "name email") // user info
      .populate("products.product", "name brand price discount images category"); 

    if (!carts || carts.length === 0) {
      return res.status(200).json({ message: "No carts found" });
    }

    res.status(200).json({
      message: "All carts fetched successfully",
      carts
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching all carts", error });
  }
}); 

cartRoute.patch('/cart/update', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;   
    const userId = req.user.id;

    let cart = await Cartitems.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.products.find(p => p.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Product not in cart" });

    if (quantity <= 0) {

      cart.products = cart.products.filter(p => p.product.toString() !== productId);
    } else {
  
      item.quantity = quantity;
    }


    cart.totalPrice = cart.products.reduce(
      (sum, i) => sum + i.discountedPrice * i.quantity, 0
    );
    cart.totalDiscount = cart.products.reduce(
      (sum, i) => sum + (i.price - i.discountedPrice) * i.quantity, 0
    );

    await cart.save();
    const populatedCart = await cart.populate("products.product");

    res.json({ message: "Quantity updated", populatedCart });
  } catch (err) {
    res.status(500).json({ message: "Update quantity error", error: err.message });
  }
});

// Delete user cart (Admin option)
// cartRoute.delete('/admin/cart/delete/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const cart = await Cartitems.findOneAndDelete({ user: userId });

//     if (!cart) {
//       return res.status(404).json({ message: "Cart not found for this user" });
//     }

//     res.status(200).json({
//       message: "User cart deleted successfully",
//       deletedCart: cart
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Error deleting cart", error });
//   }
// });

export default cartRoute;