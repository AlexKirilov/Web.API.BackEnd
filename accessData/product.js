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
        if (!!productData.price) by.price = productData.price;              // TODO: Search between min and max price
        if (!!productData.quantity) by.quantity = productData.quantity;
        if (!!productData.categoryID) by.categoryID = productData.categoryID;     // TODO: Change Category functionality
        console.log(by)
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
    if (!!!req.siteID || (!!!productData.name || productData.name.trim() == '')) {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    productData.siteID = req.siteID;

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

productRouter.post('/removeproducts', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    let by = {};
    try {
        if (!!!req.siteID)
            return res.status(401).json({ message: 'Unauthorized' });

        if (!!data.id) by._id = data.id;
        if (!!data.categoryID) {
            by.siteID = req.siteID; // This will delete all products coneccted with that web site if we remove categories
            by.categoryID = data.categoryID;
        }

        Products.find(by, (err, r) => console.log(err, r));
        Products.remove(by, err => {
            res.status(201).send(variables.successMsg.remove);
        });
    } catch (err) {
        return res.json(variables.errorMsg.type500.notfound);
    }
});


productRouter.post('/removeAllProductByCategory', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    try {

        let by = { siteID: req.siteID, categoryID: data.categoryID }
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