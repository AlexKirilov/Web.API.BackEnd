var Invoices = require('../models/store/Invoices');
var express = require('express');
var InvoiceRouter = express.Router();
var variables = require('../var');
var func = require('../func');

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
// TODO: secure the invoices results
InvoiceRouter.post('/invoices', func.checkAuthenticated, async (req, res) => {
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
        let result = await Invoices.find(by); // TODO: findon or find --> result should be aways only one per client / user
        if (result == null) {
            return res.status(200).send({ message: 'There are no products found!' })
        }
        res.send(result);

    } else {
        return res.status(500).send('Customer Invoice Details -> ' + variables.errorMsg.type500.serverError);
    }
});


/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////

InvoiceRouter.post('/addinvoice', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    if (!!req.userId || !!req.siteID || data.GDPR == 'false') {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    // Check if shoud be edit
    if (!!data.invoiceID) {
        let exist = await Invoices.find({ _id: data.invoiceID, siteID: req.siteID });
        if (exist.length > 0) {
            Invoices.findByIdAndUpdate(exist[0]._id, data, (err, result) => { //variables.successMsg.update
                if (!err) res.status(201).send(variables.successMsg.update);
                else res.status(500).send(variables.errorMsg.type500.serverError);
            });
        }
    }

    else { // If not exist create new Invoice
        let invoiceData = InvoiceCustomerData.find({ siteID: req.siteID, customerID: req.userId });
        if (!!invoiceData._id) {
            data.siteID = req.siteID;
            data.customerID = req.userId;
            data.customerInvoiceID = invoiceData._id

            let newData = new Invoices(data);
            newData.save((err, result) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.type500.serverError);
                }
                res.status(200).send(variables.successMsg.created);
            });
        } else {
            res.status(404).json({ message: 'Missing Invoice Data Details! Add invoice data and try again.' });
        }
    }
});

/////////////////////////////////////////////////
/////////////////   REMOVE   ////////////////////
/////////////////////////////////////////////////

InvoiceRouter.post('/removeinvoices', func.checkAuthenticated, (req, res) => {
    try {
        if (req.siteID == void 0)
            return res.status(400).send(variables.errorMsg.type401.invalidData);

        if (req.all && !req.allbyCustomer && !req.invoiceID) { // Remove all by web site
            Invoices.remove({ siteID: req.siteID });
        } else if (!req.all && req.allbyCustomer && !req.invoiceID) { // Remove all by customer ID
            Invoices.remove({ siteID: req.siteID, customerID: req.userId });
        } else if (!req.all && !req.allbyCustomer && req.invoiceID) { //Remove by Invoice ID
            Invoices.findByIdAndRemove(req.invoiceID, (err, results) => {
                if (err) res.status(500).send(variables.errorMsg.type500.notfound);
            });
        }
        res.status(200).json(variables.successMsg.remove);

    } catch (err) {
        return res.status(500).send(variables.errorMsg.type500.notfound);
    }
});

module.exports = InvoiceRouter;
