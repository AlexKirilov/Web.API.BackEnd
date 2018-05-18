var express = require('express');
var mapChartRouter = express.Router();

var cat = require('../models/Categories');
var subCat = require('../models/SubCategories');
var webContacts = require('../models/WebContacts');
var products = require('../models/store/Products');
var cusInvoiceDetails = require('../models/store/CustomerInvoiceDetails');

mapChartRouter.get('/chart', (req, res) => {
    var mapData = req.body;
    mapData.type = 'store';

    switch (mapData.type) {
        case 'store':
            let resCat = Object.keys(cat.schema.paths);
            let resSubCat = Object.keys(subCat.schema.paths);
            let resWebContacts = Object.keys(webContacts.schema.paths);
            let resProducts = Object.keys(products.schema.paths);
            let resInvoices = Object.keys(cusInvoiceDetails.schema.paths);
            let collection = [resCat, resSubCat, resWebContacts, resProducts, resInvoices];
            // console.log(collection);
            //  console.log(products.schema.pathType)
            break;
    }


});

module.exports = mapChartRouter;