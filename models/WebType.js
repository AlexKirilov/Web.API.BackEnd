var mongoose = require('mongoose');

var webTypeSchema = new mongoose.Schema({
    name: String
});

module.exports = mongoose.model('WebType', webTypeSchema);