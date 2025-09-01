import { Router } from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";


const ProductRoute = Router(); 

// Get products by admin (own products only)
ProductRoute.get("/admin/products", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id })
      .populate("category", "name");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all products (with user + category populated)
ProductRoute.get('/product/get', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('user', "name email")
      .populate('category', 'name');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Products fetching error !!", error });
  }
});

// Create new product
ProductRoute.post(
  "/product/post",
  upload.array("images", 5),
  authMiddleware,
  async (req, res) => {
    try {
      console.log("Raw body:", req.body);

      const {
        name,
        price,
        overview,
        status,
        discount,
        quantity,
        description,
        category,
        metalType,
        purity,
        weight,
        stoneDetails,
        size,
        gender,
        occasion,
      } = req.body;

      const userId = req.user.id;

      // Convert values properly
      const parsedStoneDetails = stoneDetails ? JSON.parse(stoneDetails) : [];
      const parsedPrice = Number(price);
      const parsedDiscount = Number(discount) || 0;
      const parsedQuantity = Number(quantity) || 0;
      const parsedWeight = weight ? Number(weight) : null;

      const images = req?.files?.map((file) => `/uploads/${file.filename}`);

      if (!name || !parsedPrice || !category || !metalType) {
        return res
          .status(400)
          .json({ message: "Required product details missing!" });
      }

      const checkProduct = await Product.findOne({ name, user: userId });
      if (checkProduct) {
        return res
          .status(409)
          .json({ message: "Product already created!" });
      }

      const product = new Product({
        name,
        price: parsedPrice,
        overview,
        status,
        images,
        discount: parsedDiscount,
        quantity: parsedQuantity,
        description,
        user: userId,
        category,
        metalType,
        purity,
        weight: parsedWeight,
        stoneDetails: parsedStoneDetails, //  proper array
        size,
        gender,
        occasion,
      });

      await product.save();

      res.status(201).json({
        message: "Product created successfully!",
        product,
      });
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({
        message: "Product creation error!",
        error: error.message,
      });
    }
  }
);



// Update product
ProductRoute.put( "/product/update/:id",upload.array("images", 5),authMiddleware,async (req, res) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;
       console.log(req.params.id);
     console.log(req.body);
      const product = await Product.findOne({ _id: productId, user: userId });
      if (!product) {
        return res
          .status(404)
          .json({ message: "Product not found or unauthorized!" });
      }

      // Parse fields
      const {
        name,
        price,
        overview,
        status,
        discount,
        quantity,
        description,
        category,
        metalType,
        purity,
        weight,
        stoneDetails,
        size,
        gender,
        occasion,
      } = req.body;

      const parsedStoneDetails = stoneDetails ? JSON.parse(stoneDetails) : [];
      const parsedPrice = price ? Number(price) : product.price;
      const parsedDiscount = discount ? Number(discount) : product.discount;
      const parsedQuantity = quantity ? Number(quantity) : product.quantity;
      const parsedWeight = weight ? Number(weight) : product.weight;

      // Handle new images if uploaded
      let images = product.images;
      if (req.files && req.files.length > 0) {
        images = req.files.map((file) => `/uploads/${file.filename}`);
      }

      // Update fields
      product.name = name || product.name;
      product.price = parsedPrice;
      product.overview = overview || product.overview;
      product.status = status || product.status;
      product.discount = parsedDiscount;
      product.quantity = parsedQuantity;
      product.description = description || product.description;
      product.category = category || product.category;
      product.metalType = metalType || product.metalType;
      product.purity = purity || product.purity;
      product.weight = parsedWeight;
      product.stoneDetails =
        parsedStoneDetails.length > 0 ? parsedStoneDetails : product.stoneDetails;
      product.size = size || product.size;
      product.gender = gender || product.gender;
      product.occasion = occasion || product.occasion;
      product.images = images;

      await product.save();

      res.status(200).json({
        message: "Product updated successfully!",
        updatedProduct: product,
      });  
      console.log('update Product');
    } catch (error) {
      console.error("Product update error:", error);
      res
        .status(500)
        .json({ message: "Product update error", error: error.message });
    }
  }
);

 
ProductRoute.patch("/product/update/:id", async (req, res) => {
  try {
    let { price, discount } = req.body;

    // Convert to numbers if provided
    price = price !== undefined ? Number(price) : undefined;
    discount = discount !== undefined ? Number(discount) : undefined;

    if (price !== undefined && isNaN(price)) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }
    if (discount !== undefined && (isNaN(discount) || discount < 0 || discount > 100)) {
      return res
        .status(400)
        .json({ message: "Discount must be a valid number between 0 and 100" });
    }

    if (price === undefined && discount === undefined) {
      return res
        .status(400)
        .json({ message: "Please provide price or discount to update" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { ...(price !== undefined && { price }), ...(discount !== undefined && { discount }) } },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Patch update error:", error);
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
});

// Delete product
ProductRoute.delete('/product/:id', authMiddleware, async (req, res) => {
  try { 
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized!" });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({ message: "Product deletion error", error });
  }
});

// Count products by category
ProductRoute.get('/product/count', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find();
    const categoryCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id });
        return {
          category: cat._id,
          name: cat.name,
          count
        }
      })
    );  
            
    res.status(200).json({ categoryCount });
  } catch (error) {
    res.status(500).json({ message: "Fetching product count Error", error });
  }
});

export default ProductRoute;
