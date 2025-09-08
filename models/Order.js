const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    cart: { type: Array, required: true },
    address: { type: Object, required: true },
    status: { type: String, default: "pending" }, // pending | paid | failed
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
