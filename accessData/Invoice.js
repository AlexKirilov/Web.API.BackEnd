const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const SiteLogs = require('../models/SiteLogs');
const InvoiceCustomerData = require('../models/store/InvoiceCustomerData');
const Invoices = require('../models/store/Invoices');
const Customers = require('../models/Customers');
const express = require('express');
const InvoiceRouter = express.Router();
const variables = require('../var');
const func = require('../func');
//READY

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
                new SiteLogs({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'check',
                    sysLevel: 'auth'
                }).save();
                res.status(500).json({ error: err });
            })
   */

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
// TODO: secure the invoices results
InvoiceRouter.get('/invoices', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let by = { siteID: req.siteID };
        var data = req.body;

        if (!!data.eik) by.eik = data.eik;
        if (!!data.town) by.town = data.town;
        if (!!data.bulstat) by.bulstat = data.bulstat;
        if (!!data.country) by.country = data.country;
        if (!!data.postcode) by.postcode = data.postcode;
        if (!!data.customerID) by.customerID = data.customerID;
        if (!!data.customerInvoiceID) by.customerInvoiceID = data.customerInvoiceID;
        if (data) {
            Invoices.find(by).exec() // TODO: findon or find --> result should be aways only one per client / user
                .then(data => {
                    if (data.length == 0) { res.status(200).send([]) }
                    else if (req.userId == result.customerInvoiceID || req.authLevel == 'AD' || req.authLevel == 'MN') {
                        res.status(200).send(data);
                    } else {
                        res.status(401).send(variables.errorMsg.unauthorized);
                    }
                }
            )
        }
    }
});


/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
// Requires data --> By Customer/Employee (level CU or EE) If edit need  {invoiceID}
// Requires data --> By Admin or Manager or Employee { customerID } If Edit need {invoiceID}
// TODO: Maybe need to be change the conditions of creation for v2 // data Update or creation access levels
InvoiceRouter.post('/addOrEditInvoice', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let data = req.body;
        // Add by the customer itself
        if (req.authLevel == 'CU' || (req.authLevel == 'EE' && !!!data.customerID)) {
            //Get Invoice Customers data
            InvoiceCustomerData.findOne({ customerID: req.userId }, (err, invoiceData) => {
                if (err)
                    return res.status(500).send(variables.errorMsg.serverError);

                data.customerID = req.userId;
                data.siteID = req.siteID;

                if (invoiceData == null) {
                    data.flag = 1;
                    new Invoices(data).save().then(() => {
                        logMSG({
                            siteID: req.siteID,
                            customerID: req.userId,
                            level: 'information',
                            message: `New invoices was created successfully`,
                            sysOperation: 'update',
                            sysLevel: 'invoices'
                        });
                        res.status(200).send(variables.successMsg.created);
                    }).catch(err => {
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
                } else {
                    data.customerInvoiceID = invoiceData.customerInvoiceID;
                    if (!!data.invoiceID) {
                        Invoices.findByIdAndUpdate(data.invoiceID, data)
                            .then(update => {
                                logMSG({
                                    siteID: req.siteID,
                                    customerID: req.userId,
                                    level: 'information',
                                    message: `Invoices was updated successfully`,
                                    sysOperation: 'update',
                                    sysLevel: 'invoices'
                                });
                                res.status(200).json({ data: update, message: 'Invoice data was successfully updated' }); // Sending the updated request call.
                            }).catch(err => {
                                logMSG({
                                    siteID: req.siteID,
                                    customerID: req.userId,
                                    level: 'error',
                                    message: func.onCatchCreateLogMSG(err),
                                    sysOperation: 'update',
                                    sysLevel: 'invoices'
                                });
                                res.status(500).json({ error: err });
                            });
                    } else {
                        return res.status(500).send(variables.errorMsg.serverError);
                    }
                }
            });
        }
    }
    // Add by Admin or Manager
    if ((req.authLevel == 'AD' || req.authLevel == 'MN' || req.authLevel == 'EE') && data.customerID) {
        // Get customers data
        Customers.findOne({ _id: data.customerID }, (err, customerData) => {
            if (err)
                return res.status(500).send(variables.errorMsg.serverError);
            if (customerData == null)
                return res.status(200).send({ message: 'There are no customers found!' });
            else {

                InvoiceCustomerData.findOne({ customerID: data.customerID }, (err, invoiceData) => {
                    if (err)
                        return res.status(500).send(variables.errorMsg.serverError);

                    data.customerID = data.customerID;
                    data.siteID = req.siteID;
                    if (invoiceData == null) {
                        data.flag = 0;
                        new Invoices(data).save().then(() => {
                            logMSG({
                                siteID: req.siteID,
                                customerID: req.userId,
                                level: 'information',
                                message: `Invoices was updated successfully`,
                                sysOperation: 'update',
                                sysLevel: 'invoices'
                            });
                            res.status(200).send(variables.successMsg.created);
                        }).catch(err => {
                            logMSG({
                                siteID: req.siteID,
                                customerID: req.userId,
                                level: 'error',
                                message: func.onCatchCreateLogMSG(err),
                                sysOperation: 'update',
                                sysLevel: 'invoices'
                            });
                            res.status(500).json({ error: err });
                        });
                    } else {
                        data.customerInvoiceID = invoiceData.customerInvoiceID;
                        if (!!data.invoiceID) {
                            Invoices.findByIdAndUpdate(data.invoiceID, data)
                                .then(update => {
                                    res.status(200).json({ data: update, message: 'Invoice data was successfully updated' }); // Sending the updated request call.
                                })
                                .catch(err => {
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
                        } else {
                            return res.status(500).send(variables.errorMsg.serverError);
                        }
                    }
                });
            }
        });
    }
});


/////////////////////////////////////////////////
/////////////////   REMOVE   ////////////////////
/////////////////////////////////////////////////
// { all: boolean, cutomerID, InvoiceID }
InvoiceRouter.post('/removeinvoices', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let data = req.body;
        try {
            if (!!!req.siteID)
                return res.status(400).send(variables.errorMsg.invalidData);

            if (!!!data.all) data.all = false;

            // Remove all by web site
            // If all = true, InvoiceID and CustomerID are null or empty
            if (data.all && !!!data.invoiceID && !!!data.cutomerID && (req.authLevel == 'AD' || req.authLevel == 'MN')) {
                Invoices.remove({ siteID: req.siteID }).then(() => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'information',
                        message: `All Invoices were removed successfully!`,
                        sysOperation: 'delete',
                        sysLevel: 'invoices'
                    });
                });;

                // Remove all by customer ID
            } else if (data.all && !!data.cutomerID && !!!data.invoiceID && (req.authLevel == 'AD' || req.authLevel == 'MN')) {
                let id = (!!data.cutomerID) ? data.cutomerID : req.userId;
                Invoices.remove({ siteID: req.siteID, customerID: id }).then(() => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'information',
                        message: `All Invoices were removed successfully for the selected customer`,
                        sysOperation: 'delete',
                        sysLevel: 'invoices'
                    });
                });
                //Remove by Invoice ID
            } else if (!data.all && !!data.invoiceID) {
                Invoices.findByIdAndRemove(data.invoiceID).then(() => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'information',
                        message: `Invoices was removed successfully`,
                        sysOperation: 'delete',
                        sysLevel: 'invoices'
                    });
                    return res.status(200).json(variables.successMsg.remove);
                });
            } else {
                return res.status(200).json({ message: 'There was no data for deleting' });
            }
            res.status(200).json(variables.successMsg.remove);

        } catch (err) {
            return res.status(500).send(variables.errorMsg.notfound);
        }
    }
});

module.exports = InvoiceRouter;
