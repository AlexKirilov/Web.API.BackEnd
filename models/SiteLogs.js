var mongoose = require('mongoose');

var SiteLogsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers'},
    type: String,
    level: String, // Fatal, Error, Warning, Information
    message: String,
    logDateTime: Date,
});

module.exports = mongoose.model('SiteLogs', SiteLogsSchema);