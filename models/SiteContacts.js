var mongoose = require('mongoose');

var SiteContactsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    phones: Array,
    connections: {
        facebook: String,
        twitter: String,
        linkedin: String,
        skype: String
    },
    coordinates: {
        latitude: Number,
        longitude: Number,
        url: String
    }
});

module.exports = mongoose.model('SiteContacts', SiteContactsSchema);
