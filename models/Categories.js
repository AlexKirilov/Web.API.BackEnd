var mongoose = require('mongoose');

var categorySchema = new mongoose.Schema({
    name: String,
    type: String,
});

module.exports = mongoose.model('Categories', categorySchema);