var mongoose = require('mongoose');

var subCategoriesSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories'},
    subCategory: String,
});

module.exports = mongoose.model('SubCategories', subCategoriesSchema);