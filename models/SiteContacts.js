var mongoose = require('mongoose');

var SiteContactsSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    phones: { type: Array, default: [] },
    connections: {
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        skype: { type: String, default: '' }
    },
    coordinates: {
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
        url: { type: String, default: '' }
    },
    address: {
        town: { type: String, default: '' },
        address: { type: String, default: '' },
        country: { type: String, default: '' },
        postcode: { type: String, default: '' },
    }
});

module.exports = mongoose.model('SiteContacts', SiteContactsSchema);
