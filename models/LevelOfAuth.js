var mongoose = require('mongoose');

var LevelOfAuthSchema = new mongoose.Schema({
    name: String,
    type: String
});

module.exports = mongoose.model('LevelOfAuth', LevelOfAuthSchema);