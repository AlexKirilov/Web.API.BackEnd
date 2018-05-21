let Products = require('../models/store/Products');
let Customer = require('../models/Customers');
let express = require('express');
let productRouter = express.Router();
let func = require('../func');
let variables = require('../var');

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
productRouter.post('/products', func.checkCustomerAuthenticated, async (req, res) => {
    let by = {};

    let productData = req.body;
    if (productData) {

        by = { customer: req.userId };
        if (!!productData.name) by.name = { "$regex": productData.name, "$options": 'i' };
        if (!!productData.price) by.price = productData.price;
        if (!!productData.quantity) by.quantity = productData.quantity;
        if (!!productData.category) by.category = productData.category;
        if (!!productData.subcategory) by.subcategory = productData.subcategory;
        let userProductsData = await Products.find(by, (err, response) => {
            if (err) return res.json(variables.errorMsg.type500.notfound);
            // if(response.length == 0 ) return res.json({message: '!There are no products found!'});
            res.send(response);
        });

    } else {
        return res.status(500).send('Products -> ' + variables.errorMsg.type500.serverError);
    }
});

/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////

productRouter.post('/createproduct', func.checkCustomerAuthenticated, (req, res) => { //TODO Only if it`s Admin or Manager
    let productData = req.body;
    if (req.userId == void 0 && (productData.name == void 0 || productData.name.trim() == '')) {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    productData.customer = req.userId;
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

//TODO Only if it`s Admin or Manager
productRouter.post('/removeproduct', func.checkCustomerAuthenticated, async (req, res) => {
    let productData = req.body;
    try {
        if (req.userId == void 0)
            return res.status(400).send(variables.errorMsg.type401.invalidData);

        // This will delete all products connected with that customer
        Products.findByIdAndRemove(productData._id, (err, item) => {
            if (err) return res.status(500).send(variables.errorMsg.type500.remove);
            res.status(201).send(variables.successMsg.remove)
        });
    } catch (err) {
        return res.json(variables.errorMsg.type500.notfound);
    }
});
//TODO BY CAT OR SuBCat
productRouter.post('/removeAllProductByCategory', func.checkCustomerAuthenticated, async (req, res) => {
    let productData = req.body;
    try {
        if (req.userId == void 0)
            return res.status(400).send(variables.errorMsg.type401.invalidData);

        let by = { category: productData.catId }
        // This will delete all products connected with that category
        Products.remove(by).exec(
            res.status(201).send(variables.successMsg.remove)
        );
    } catch (err) {
        return res.json(variables.errorMsg.type500.notfound);
    }
});

productRouter.post('/removeAllproductsByCustomer', func.checkCustomerAuthenticated, async (req, res) => {
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

module.exports = productRouter;