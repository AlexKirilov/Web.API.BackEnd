let Products = require('../models/store/Products');
let Customer = require('../models/Customers');
let express = require('express');
let productRouter = express.Router();
let func = require('../func');
let variables = require('../var');

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
productRouter.post('/products', func.checkAuthenticated, (req, res) => {
    let by = {};
    let productData = req.body;

    if (!!productData && !!req.siteID) {
        by = { customer: req.siteID };
        if (!!productData.name) by.name = { "$regex": productData.name, "$options": 'i' };
        if (!!productData.price) by.price = productData.price;              // TODO: Search between min and max price
        if (!!productData.quantity) by.quantity = productData.quantity;
        if (!!productData.category) by.category = productData.category;     // TODO: Change Category functionality

        Products.find(by, (err, response) => {
            if (err) return res.json(variables.errorMsg.type500.notfound);
            res.send(response);
        });
    } else {
        return res.status(500).send('Products -> ' + variables.errorMsg.type500.serverError);
    }
});

/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////

productRouter.post('/createproduct', func.checkAuthenticated, (req, res) => { //TODO Only if it`s Admin or Manager
    let productData = req.body;
    if (!!req.siteID && (!!productData.name || productData.name.trim() == '')) {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    productData.siteID = req.siteID;
    console.log(productData)

    let newProduct = new Products(productData);
    newProduct.save((err, newProd) => {
        if (err) {
            return res.status(500).send(variables.errorMsg.type500.serverError);
        }
        res.status(200).send(variables.successMsg.created); //TODO: change message
    });
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

productRouter.post('/removeproduct', func.checkAuthenticated, async (req, res) => {
    let productData = req.body;
    try {
        if (req.siteID == void 0)
            return res.status(400).send(variables.errorMsg.type401.invalidData);

        Products.findByIdAndRemove(productData._id, (err, item) => {
            if (err) return res.status(500).send(variables.errorMsg.type500.remove);
            res.status(201).send(variables.successMsg.remove)
        });
    } catch (err) {
        return res.json(variables.errorMsg.type500.notfound);
    }
});


productRouter.post('/removeAllProductByCategory', func.checkAuthenticated, async (req, res) => {
    let productData = req.body;
    try {
        if (req.siteID == void 0)
            return res.status(400).send(variables.errorMsg.type401.invalidData);

        let by = { siteID: req.siteID, categoryID: productData.categoryID }
        // This will delete all products connected with that category or subcategory
        Products.remove(by).exec(
            res.status(201).send(variables.successMsg.remove)
        );
    } catch (err) {
        return res.json(variables.errorMsg.type500.notfound);
    }
});

/*
//TODO: for future development
productRouter.post('/removeAllproductsByCustomer', func.checkAuthenticated, async (req, res) => {
    try {
        if (req.userId == void 0)
            return res.status(400).send(variables.errorMsg.type401.invalidData);

        // This will delete all products connected with that customer
        Products.remove({ customer: req.userId }).exec(
            res.status(201).send(variables.successMsg.remove)
        );
    } catch (err) {
        return res.json(variables.errorMsg.type500.notfound);
    }
});
*/
module.exports = productRouter;