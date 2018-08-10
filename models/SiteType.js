var mongoose = require('mongoose');

var SiteTypeSchema = new mongoose.Schema({
    name: { type: String, default: '' }
});

module.exports = mongoose.model('SiteType', SiteTypeSchema);