import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },

    description: { type: String, },
    overview: { type: String },

    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    quantity: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: ["in-stock", "out-of-stock", "preorder"], default: "in-stock" },

    //  Only store summary of reviews
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },

    images: [{ type: String }],

    // Jewelry-specific fields
    metalType: { type: String, enum: ["Gold", "Silver", "Platinum", "Diamond", "Other"], required: true },
    purity: { type: String },
    weight: { type: Number, min: 0 },
    stoneDetails: [
      {
        stoneType: { type: String },
        carat: { type: Number, min: 0 },
        color: { type: String },
        clarity: { type: String },
      },
    ],
    size: { type: String },
    gender: { type: String, enum: ["Men", "Women", "Unisex", "Kids"], default: "Unisex" },
    occasion: { type: String },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual - Discounted Price
productSchema.virtual("discountedPrice").get(function () {
  return this.price - (this.price * this.discount) / 100;
});

// Virtual - Stock Message
productSchema.virtual("stockMessage").get(function () {
  if (this.quantity <= 0) return "Out of stock";
  if (this.quantity < 10) return `${this.quantity} left in stock`;
  return "In stock";
});

export default mongoose.model("Product", productSchema);