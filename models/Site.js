var mongoose = require('mongoose');

var SiteSchema = new mongoose.Schema({
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'SiteType'},
    name: { type: String, default: '' },
    publicKey: { type: String, default: '' },
});

module.exports = mongoose.model('Site', SiteSchema);