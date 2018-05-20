var Products = require('../models/store/Products');
var express = require('express');
var productRouter = express.Router();
var func = require('../func');
var variables = require('../var');

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
productRouter.post('/products', func.checkAuthenticated, async (req, res) => {
    //By Owner --- ????
    //TODO: Search by substring
    let by = {};

    var productData = req.body;
    if (productData) {

        by = { customer: req.userId };
        if (!!productData.name) by.name = { "$regex": productData.name, "$options": 'i' };
        if (!!productData.price) by.price = productData.price;
        if (!!productData.quantity) by.quantity = productData.quantity;
        if (!!productData.category) by.category = productData.category;
        if (!!productData.subcategory) by.subcategory = productData.subcategory;
        let userProductsData = await Products.find(by);
        if (userProductsData == null) {
            return res.status(200).send({ message: 'There are no products found!' })
        }
        res.send(userProductsData);

    } else {
        return res.status(500).send('Products -> ' + variables.errorMsg.type500.serverError);
    }
});

//Search by substring
// TODO: Do we need this ????
// productRouter.post('/checkForExistingWebType', async (req, res) => {
//     var typeData = req.body;
//     if (typeData && typeData.name.trim() != '') {
//         var type = await Products.findOne({ name: typeData.name })
//         if (type !== null) {
//             return res.status(204).send({ exist: true })
//         }
//         res.status(200).send({ exist: false });
//     }
// });

/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////

productRouter.post('/createproduct', func.checkAuthenticated, (req, res) => {
    let productData = req.body;
    if (req.userId == void 0 && (productData.name == void 0 || productData.name.trim() == '')) {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    productData.customer = req.userId;

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

// TODO ONLY SYAdmin can Edit and Customer it SELF
productRouter.post('/removeproducts', func.checkAuthenticated, async (req, res) => {
    try {
        if (req.userId == void 0)
            return res.status(400).send(variables.errorMsg.type401.invalidData);

        Products.remove({ customer: req.userId }).exec(
            res.status(201).send(variables.successMsg.remove)
        );
    } catch (err) {
        return res.json(variables.errorMsg.type500.notfound);
    }
});

module.exports = productRouter;