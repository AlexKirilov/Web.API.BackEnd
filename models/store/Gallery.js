const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    images: { default: [] }
});

module.exports = mongoose.model('Gallery', gallerySchema);
