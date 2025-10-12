const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }],
    category: { type: String, required: true },
    description: { type: String },
    inStock: { type: Number, default: 0 },
    sizes: [{ type: String }],
    oldPrice: { type: Number },
    variations: [
      {
        color: String,
        image: String,
        inStock: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
