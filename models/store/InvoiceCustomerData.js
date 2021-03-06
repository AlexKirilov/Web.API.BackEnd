const mongoose = require('mongoose');
//Fakturi

const cuInvoiceDetailsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
    address: { type: String, default: '' },
    eik: { type: String, default: '' }, //ЕИК
    bulstat: { type: String, default: '' }, //БУЛСТАТ
    citizenship: { type: String, default: '' },
    town: { type: String, default: '' },
    country: { type: String, default: '' },
    postcode: { type: String, default: '' },
    phone: { type: Number, default: 0 },
    countryPhoneCode: { type: String, default: '' },
});

module.exports = mongoose.model('CustomerInvoiceData', cuInvoiceDetailsSchema);
