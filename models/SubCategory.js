var mongoose = require('mongoose');

var subCategorySchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
    subCategory: String,
});

module.exports = mongoose.model('SubCategory', subCategorySchema);