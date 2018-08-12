const mongoose = require('mongoose');
//Fakturi

const invoicesSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
    customerInvoiceID: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerInvoiceData'},
    address: { type: String, default: '' },
    eik: { type: String, default: '' }, //ЕИК
    bulstat: { type: String, default: '' }, //БУЛСТАТ
    citizenship: { type: String, default: '' },
    town: { type: String, default: '' },
    country: { type: String, default: '' },
    postcode: { type: String, default: '' },
    phone: { type: Number, default: 0 },
    countryPhoneCode: String,
    GDPR: { type: Boolean, default: false },
    flag: { type: Number, default: 0 },
});

module.exports = mongoose.model('Invoices', invoicesSchema);
