const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  siteID: { type: mongoose.Schema.Types.ObjectId, ref: "Site" },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  order: { type: Array, default: [] },
  date: { type: Date, default: Date() },
  flag: { type: Number, default: 0 } 
  // -1 Canceled // 0 For approval // 1 Approved // 2 Delivering // 3 Delivered
});

module.exports = mongoose.model("Orders", orderSchema);
