var mongoose = require('mongoose');
//Fakturi

var invoicesSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
    customerInvoiceID: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerInvoiceData'},
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
    flag: Number,
});

module.exports = mongoose.model('Invoices', invoicesSchema);
