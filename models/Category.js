var mongoose = require('mongoose');

var categorySchema = new mongoose.Schema({
    name: String,
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'SiteType'},
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
});

module.exports = mongoose.model('Category', categorySchema);