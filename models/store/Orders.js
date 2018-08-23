const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  siteID: { type: mongoose.Schema.Types.ObjectId, ref: "Site" },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  order: { type: Array, default: [] }
});

module.exports = mongoose.model("Orders", orderSchema);
