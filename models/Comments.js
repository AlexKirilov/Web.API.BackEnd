var mongoose = require('mongoose');

var commentsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers'},
    productID : { type: mongoose.Schema.Types.ObjectId, ref: 'Products'},
    comment: String,
    customersName: String
});

module.exports = mongoose.model('Comments', commentsSchema);