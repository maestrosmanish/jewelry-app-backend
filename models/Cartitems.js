import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
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

        // snapshot fields 
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true }, // actual price at that time
        discount: { type: Number, default: 0 },  // % discount
        discountedPrice: { type: Number, required: true }, // auto calc
      },
    ],

    totalPrice: { type: Number, default: 0 },    // total before discount
    totalDiscount: { type: Number, default: 0 }, // total discount amount
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual → after discount
cartSchema.virtual("finalPrice").get(function () {
  return this.totalPrice - this.totalDiscount;
});

// Virtual → with tax
cartSchema.virtual("grandTotal").get(function () {
  const tax = (this.totalPrice - this.totalDiscount) * 0.05; // 5% GST
  return this.totalPrice - this.totalDiscount + tax;
});

// Auto calculate before save
cartSchema.pre("save", function (next) {
  this.products.forEach((item) => {
    item.discountedPrice =
      item.price - (item.price * (item.discount || 0)) / 100;
  });

  this.totalPrice = this.products.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  this.totalDiscount = this.products.reduce(
    (acc, item) =>
      acc + ((item.price * (item.discount || 0)) / 100) * item.quantity,
    0
  );

  next();
});

export default mongoose.model("Cart", cartSchema);
