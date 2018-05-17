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

        by = { user: req.userId };
        if (!!productData.name) by.name = productData.name;
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


/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////

productRouter.post('/createproduct', func.checkAuthenticated, (req, res) => {
    let productData = req.body;
    if (req.userId == void 0 && (productData.name == void 0 || productData.name.trim() == '')) {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    productData.user = req.userId;

    let newProduct = new Products(productData);
    newProduct.save((err, newProd) => {
        if (err) {
            return res.status(500).send(variables.errorMsg.type500.serverError);
        }
        res.status(200).send(variables.successMsg.webtype); //TODO: change message
    });
});

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

module.exports = productRouter;