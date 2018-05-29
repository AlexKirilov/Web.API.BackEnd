let Products = require('../models/store/Products');
let Customer = require('../models/Customers');
let express = require('express');
let productRouter = express.Router();
let func = require('../func');
let variables = require('../var');

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
//categoryID
productRouter.post('/products', func.checkAuthenticated, (req, res) => {
    let by = {};
    let productData = req.body;

    if (!!productData && !!req.siteID) {
        by = { siteID: req.siteID };
        if (!!productData.name) by.name = { "$regex": productData.name, "$options": 'i' };
        if (!!productData.price) by.price = productData.price; // TODO: Search between min and max price
        if (!!productData.quantity) by.quantity = productData.quantity;
        if (!!productData.categoryID) by.categoryID = productData.categoryID;
        Products.find(by, (err, response) => {
            if (err) {
                return res.json(variables.errorMsg.notfound);
            }
            return res.send(response);
        });
    } else {
        return res.status(500).send(variables.errorMsg.serverError);
    }
});

/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////
// Required data { name : 'name' }
productRouter.post('/createproduct', func.checkAuthenticated, (req, res) => { // SPOTTODO Only if it`s Admin or Manager
    let productData = req.body;
    if (!!!req.siteID || (!!!productData.name || productData.name.trim() == '')) {
        return res.status(400).send(variables.errorMsg.invalidData);
    }

    if(!!productData.sort) productData.sort = productData.sort.filter(function(n){ return n != undefined && n.trim() != ''; }); 
    if(!!productData._id) {
        Products.findByIdAndUpdate(productData._id, productData, (err, result) => {
            if(err)  return res.status(500).send(variables.errorMsg.serverError);
            return res.status(200);
        });
    } else {
        productData.siteID = req.siteID;
        let newProduct = new Products(productData);
        newProduct.save((err, newProd) => {
            if (err) {
                return res.status(500).send(variables.errorMsg.serverError);
            }
            return res.status(200).send(variables.successMsg.created);
        });
    }
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

productRouter.post('/removeproducts', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    let by = {};
    try {
        if (!!!req.siteID)
            return res.status(401).json(variables.errorMsg.unauthorized);

        if (!!data._id) by._id = data._id;
        if (!!data.categoryID) {
            by.siteID = req.siteID; // This will delete all products connected with that web site if we remove categories
            by.categoryID = data.categoryID;
        }

        Products.remove(by, err => {
            res.status(201).send(variables.successMsg.remove);
        });
    } catch (err) {
        return res.json(variables.errorMsg.notfound);
    }
});
// Dangerous function
productRouter.post('/removeAllProductByCategory', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    try {
        let by = { siteID: req.siteID, categoryID: data.categoryID }
        // This will delete all products connected with that category or subcategory
        Products.remove(by).exec(
            res.status(201).send(variables.successMsg.remove)
        );
    } catch (err) {
        return res.json(variables.errorMsg.notfound);
    }
});

/*
//TODO: for future development
productRouter.post('/removeAllproductsByCustomer', func.checkAuthenticated, async (req, res) => {
    try {
        if (req.userId == void 0)
            return res.status(400).send(variables.errorMsg.invalidData);

        // This will delete all products connected with that customer
        Products.remove({ customer: req.userId }).exec(
            res.status(201).send(variables.successMsg.remove)
        );
    } catch (err) {
        return res.json(variables.errorMsg.notfound);
    }
});
*/
module.exports = productRouter;