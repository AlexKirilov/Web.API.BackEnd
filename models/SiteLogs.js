var mongoose = require('mongoose');

var SiteLogsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers'},
    logType: { type: String, default: '-' }, // Product // Customer // Invoices
    level: { type: String, default: '-' }, // Fatal, Error, Warning, Information
    message: { type: String, default: '-' },
    siteName: { type: String, default: '-' },
    siteOwnerAuth: { type: String, default: '-' },
    siteOwnerCust: { type: String, default: '-' },
    sysOperation: { type: String, default: '-' }, // create, get, delete, update, check,
    sysLevel: { type: String, default: '-' }, // - , auth, site, invoiceDetails, contactsDetails
    logDateTime: { type: Date, default: new Date ().toISOString() },
});

module.exports = mongoose.model('SiteLogs', SiteLogsSchema);