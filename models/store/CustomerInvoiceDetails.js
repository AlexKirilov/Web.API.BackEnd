var mongoose = require('mongoose');
//Fakturi

var cuInvoiceDetailsSchema = new mongoose.Schema({
    // siteOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
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

module.exports = mongoose.model('CustomerInvoiceDetails', cuInvoiceDetailsSchema);
