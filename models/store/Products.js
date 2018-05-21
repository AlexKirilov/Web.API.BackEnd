let mongoose = require('mongoose');

let productsSchema = new mongoose.Schema({
    // siteOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories'},
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategories'},
    name: String,
    sort: Array,
    price: Number,
    imgURL: String,
    iconURL: String,
    details: String,
    quantity: Number,
});

module.exports = mongoose.model('Products', productsSchema);
