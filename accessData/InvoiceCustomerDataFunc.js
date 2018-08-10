const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const SiteLogs = require('../models/SiteLogs');
const InvoiceCustomerData = require('../models/store/InvoiceCustomerData');
const express = require('express');
const invoiceDataRouter = express.Router();
const variables = require('../var');
const func = require('../func');
//Ready

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
// Required Data {siteID, customerID == req.userId}
// Only Customer can get the Invoice Data
invoiceDataRouter.get('/cusInvoiceDetails', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        InvoiceCustomerData.find({ siteID: req.siteID, customerID: req.userId }, '-__v -siteID -customerID -_id').exec()
            .then(results => {
                if (results.length == 0) {
                    res.json({ message: 'Data was not found!' })
                } else {
                    res.status(200).send(results[0]);
                }
            }).catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'invoicedetails'
                });
                res.status(500).json({ error: err });
            });
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
// Required Data {GDPR == true}
// Only Customer can update or create Invoice Data
invoiceDataRouter.post('/addOrEditCusInvoiceDetails', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('GDPR').not().equals(false);
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let data = req.body;
        InvoiceCustomerData.find({ siteID: req.siteID, customerID: req.userId }).exec()
            .then(results => {
                if (!!results && results.length > 0) {
                    data.siteID = req.siteID;
                    data.customerID = req.userId;
                    InvoiceCustomerData.findByIdAndUpdate(results[0]._id, data).then(() => {
                        logMSG({
                            siteID: req.siteID,
                            customerID: req.userId,
                            level: 'information',
                            message: `Invoice details were updated successfully.`,
                            sysOperation: 'update',
                            sysLevel: 'invoicedetails'
                        });
                        res.json({ message: 'Invoice Data was successfuly updated!' });
                    });
                } else {
                    data.siteID = req.siteID;
                    data.customerID = req.userId;
                    new InvoiceCustomerData(data).save()
                        .then(() => {
                            logMSG({
                                siteID: req.siteID,
                                customerID: req.userId,
                                level: 'information',
                                message: `Invoice details were created successfully.`,
                                sysOperation: 'created',
                                sysLevel: 'invoicedetails'
                            });
                            res.status(200).send(variables.successMsg.created);
                        });
                }
            }).catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'update',
                    sysLevel: 'invoicedetails'
                });
                res.status(500).json({ error: err });
            });
    }
});

/////////////////////////////////////////////////
/////////////////   REMOVE   ////////////////////
/////////////////////////////////////////////////

// Personal deletion
// This can be done personaly
invoiceDataRouter.post('/removeCusInvoiceDetails', func.checkAuthenticated, async (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('GDPR').not().equals(false);
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        InvoiceCustomerData.remove({ siteID: req.siteID, customerID: req.userId }).then( () => {
            logMSG({
                siteID: req.siteID,
                customerID: req.userId,
                level: 'error',
                message: `Invoice Data was successfully removed!`,
                sysOperation: 'deleted',
                sysLevel: 'invoicedetails'
            });
            res.json({ message: 'Invoice Data was successfully deleted!' })
        })
    }
});

module.exports = invoiceDataRouter;
