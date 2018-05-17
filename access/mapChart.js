var express = require('express');
var mapChartRouter = express.Router();

var cat = require('../models/Category');
var subCat = require('../models/SubCategory');
var webContacts = require('../models/WebContacts');
var products = require('../models/store/Products');
var invoices = require('../models/store/Invoices');

mapChartRouter.get('/chart', (req, res) => {
    var mapData = req.body;
    mapData.type = 'store';

    switch (mapData.type) {
        case 'store':
            let resCat = Object.keys(cat.schema.paths);
            let resSubCat = Object.keys(subCat.schema.paths);
            let resWebContacts = Object.keys(webContacts.schema.paths);
            let resProducts = Object.keys(products.schema.paths);
            let resInvoices = Object.keys(invoices.schema.paths);
            let collection = [resCat, resSubCat, resWebContacts, resProducts, resInvoices];
            // console.log(collection);
             console.log(invoices.schema.pathType)
            break;
    }


});

module.exports = mapChartRouter;