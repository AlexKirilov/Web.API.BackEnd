var mongoose = require('mongoose');

var SiteTypeSchema = new mongoose.Schema({
    name: String
});

module.exports = mongoose.model('SiteType', SiteTypeSchema);