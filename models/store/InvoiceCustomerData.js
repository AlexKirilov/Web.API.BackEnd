var mongoose = require('mongoose');
//Fakturi

var cuInvoiceDetailsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
    address: String,
    eik: String, //ЕИК
    bulstat: String, //БУЛСТАТ
    citizenship: String,
    town: String,
    country: String,
    postcode: String,
    phone: Number,
    countryPhoneCode: String,
    GDPR: Boolean,
});

module.exports = mongoose.model('CustomerInvoiceData', cuInvoiceDetailsSchema);
