let mongoose = require('mongoose');

let productsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    // customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'}, // For APP v 2
    categoryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
    name: String,
    sort: Array,
    price: Number,
    imgURL: String,
    iconURL: String,
    details: String,
    quantity: Number,
});

module.exports = mongoose.model('Products', productsSchema);
