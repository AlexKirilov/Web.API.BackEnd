const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    // customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'}, // For APP v 2
    categoryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
    name: { type: String, default: '' },
    pack: { type: String, default: '' },
    sort: { type: Array, default: [] },
    sizes: { type: Array, default: [] },
    price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    imgURL: { type: String, default: '' },
    iconURL: { type: String, default: '' },
    details: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
});

module.exports = mongoose.model('Products', productsSchema);
