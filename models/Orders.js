import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        // Snapshot fields (product details at the time of order)
        name: { type: String, required: true },
        brand: { type: String },
        metalType: { type: String },
        purity: { type: String },
        weight: { type: Number },
        size: { type: String },

        price: { type: Number, required: true }, // original price at order time
        discount: { type: Number, default: 0 },  // % discount
        quantity: { type: Number, required: true },

        discountedPrice: { type: Number, required: true }, // auto-calculated
      },
    ],

    totalPrice: { type: Number, }, 
    totalDiscount: { type: Number, default: 0 }, // total discount applied

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    address: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "Card", "NetBanking"],
      default: "COD",
      uppercase: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true }
);

//  Middleware: auto calculate discountedPrice for each product
orderSchema.pre("save", function (next) {
  this.products.forEach((item) => {
    item.discountedPrice =
      item.price - (item.price * (item.discount || 0)) / 100;
  });

  // calculate totals
  this.totalPrice = this.products.reduce(
    (acc, item) => acc + item.discountedPrice * item.quantity,
    0
  );

  this.totalDiscount = this.products.reduce(
    (acc, item) => acc + (item.price * (item.discount || 0)) / 100 * item.quantity,
    0
  );

  next();
});

export default mongoose.model("Order", orderSchema);
