var mongoose = require('mongoose');

var LevelOfAuthSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    type: { type: String, default: '' }
});

module.exports = mongoose.model('LevelOfAuth', LevelOfAuthSchema);