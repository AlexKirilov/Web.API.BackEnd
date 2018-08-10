const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const Products = require('../models/store/Products');
const SiteLogs = require('../models/SiteLogs');
const express = require('express');
const productRouter = express.Router();
const func = require('../func');
const variables = require('../var');

function logMSG(data) {
    new SiteLogs(data).save();
}

/*
    const { check, validationResult } = require('express-validator/check');
    const { sanitizeBody } = require('express-validator/filter');
    const SiteLogs = require('../models/SiteLogs');

    check('email').isString().isEmail().normalizeEmail();
    check('password').isString().trim().isLength({ min: 5 }).escape();
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {

    .catch(err => {
                // Add new Log
                logMSG({
                            siteID: req.siteID,
                            customerID: req.userId,
                            level: 'error',
                            message: func.onCatchCreateLogMSG(err),
                            sysOperation: 'update',
                            sysLevel: 'invoices'
                        });
                res.status(500).json({ error: err });
            })
   */

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
//categoryID
productRouter.post('/products', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let by = {};
        let productData = req.body;
        by = { siteID: req.siteID };
        if (!!productData.name) by.name = { "$regex": productData.name, "$options": 'i' };
        if (!!productData.price) by.price = productData.price; // TODO: Search between min and max price
        if (!!productData.quantity) by.quantity = productData.quantity;
        if (!!productData.categoryID) by.categoryID = productData.categoryID;
        Products.find(by).exec()
            .then(response => {
                res.status(200).send(response);
            }).catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'create',
                    sysLevel: 'products'
                });
                res.status(500).json({ error: err });
            })
    }
});

/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////
// Required data { name : 'name' }
productRouter.post('/createproduct', func.checkAuthenticated, (req, res) => { // SPOTTODO Only if it`s Admin or Manager
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('name').trim().not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let productData = req.body;
        if (!!productData.sort) productData.sort = productData.sort.filter(function (n) { return n != undefined && n.trim() != ''; });
        if (!!productData._id) {
            Products.findByIdAndUpdate(productData._id, productData)
                .then(result => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'information',
                        type: 'product',
                        message: `Product '${result.name}' was updated successfully!`,
                        sysOperation: 'update',
                        sysLevel: 'products'
                    });
                    res.status(200);
                });
        } else {
            if (productData.categoryID == '')
                productData.categoryID = null;
            productData.siteID = req.siteID;
            if (!!!req.quantity) productData.quantity = 0;
            new Products(productData).save()
                .then(() => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'information',
                        type: 'product',
                        message: `Product '${productData.name}' was added successfully!`,
                        sysOperation: 'create',
                        sysLevel: 'products'
                    });
                    res.status(200).send(variables.successMsg.created);
                }).catch(err => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'error',
                        type: 'product',
                        message: func.onCatchCreateLogMSG(err),
                        sysOperation: 'create',
                        sysLevel: 'product'
                    });
                    res.status(500).json({ error: err });
                });
        }
    }
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

productRouter.post('/removeproducts', func.checkAuthenticated, async (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('name').trim().not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let data = req.body;
        let by = {};
        try {
            if (!!data._id) by._id = data._id;
            if (!!data.categoryID) {
                by.siteID = req.siteID; // This will delete all products connected with that web site if we remove categories
                by.categoryID = data.categoryID;
            }

            Products.remove(by).then(() => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'information',
                    message: `Product was removed successfully.`,
                    sysOperation: 'delete',
                    sysLevel: 'product'
                });
                res.status(200).send(variables.successMsg.remove);
            });
        } catch (err) {
            return res.json(variables.errorMsg.notfound);
        }
    }
});
// Dangerous function
productRouter.post('/removeAllProductByCategory', func.checkAuthenticated, async (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('name').trim().not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let data = req.body;
        try {
            let by = { siteID: req.siteID, categoryID: data.categoryID }
            // This will delete all products connected with that category or subcategory
            Products.remove(by).then(() => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'information',
                    message: `All product by category ID '${data.categoryID}' were removed successfully.`,
                    sysOperation: 'delete',
                    sysLevel: 'product'
                })
                res.status(201).send(variables.successMsg.remove)
            });
        } catch (err) {
            return res.json(variables.errorMsg.notfound);
        }
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