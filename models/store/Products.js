var mongoose = require('mongoose');

var productsSchema = new mongoose.Schema({
    siteOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory'},
    name: String,
    sort: Array,
    price: Number,
    imgURL: String,
    iconURL: String,
    details: String,
    quantity: Number,
});

module.exports = mongoose.model('Products', productsSchema);
