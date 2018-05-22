var mongoose = require('mongoose');

var SiteSchema = new mongoose.Schema({
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'SiteType'},
    name: String,
    publicKey: String,
});

module.exports = mongoose.model('Site', SiteSchema);