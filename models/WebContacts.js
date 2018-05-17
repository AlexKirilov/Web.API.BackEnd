var mongoose = require('mongoose');

var webContactsSchema = new mongoose.Schema({
    siteOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
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

module.exports = mongoose.model('WebContacts', webContactsSchema);
