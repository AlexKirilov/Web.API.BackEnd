var InvoiceCustomerData = require('../models/store/InvoiceCustomerData');
var express = require('express');
var invoiceDataRouter = express.Router();
var variables = require('../var');
var func = require('../func');
//Ready

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
// Required Data {siteID, customerID == req.userId}
// Only Customer can get the Invoice Data
invoiceDataRouter.get('/cusInvoiceDetails', func.checkAuthenticated, (req, res) => {
    var data = req.body;
    if (!!data && !!req.siteID && !!req.userId) {
        InvoiceCustomerData.find({ siteID: req.siteID, customerID: req.userId }, '-__v -siteID -customerID -_id', (err, results) => {
            if (err) return res.status(500).send(variables.errorMsg.type500.serverError);
            if (results.length == 0) {
                return res.json({ message: 'Data was not found!' })
            }
            res.status(200).send(results);
        });
    } else {
        return res.status(500).send('Customer Invoice Details -> ' + variables.errorMsg.type500.serverError);
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
// Required Data {GDPR == true}
// Only Customer can update or create Invoice Data
invoiceDataRouter.post('/addOrEditCusInvoiceDetails', func.checkAuthenticated, (req, res) => {
    let data = req.body;
    if (!!!data || !!!req.userId || !!!req.siteID || data.GDPR == false) {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    InvoiceCustomerData.find({ siteID: req.siteID, customerID: req.userId }, (err, results) => {
        if (err) return res.status(500).send(variables.errorMsg.type500.serverError);
        if (!!results && results.length > 0) {
            data.siteID = req.siteID;
            data.customerID = req.userId;
            InvoiceCustomerData.findByIdAndUpdate(results[0]._id, data, (err, update) => {
                if(err) res.status(500).send(variables.errorMsg.type500.serverError);
                else res.json({message: 'Invoice Data was successfuly updated!'});
            });
        } else {
            data.siteID = req.siteID;
            data.customerID = req.userId;
            let newInvoice = new InvoiceCustomerData(data)
            newInvoice.save((err, result) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.type500.serverError);
                }
                res.status(200).send(variables.successMsg.created);
            });
        }
    });


});

/////////////////////////////////////////////////
/////////////////   REMOVE   ////////////////////
/////////////////////////////////////////////////

// Personal deletion
invoiceDataRouter.post('/removeCusInvoiceDetails', func.checkAuthenticated, async (req, res) => {
    InvoiceCustomerData.remove({ siteID: req.siteID, customerID: req.userId }, err => res.json({message: 'Invoice Data was successfully deleted!'}));
});

module.exports = invoiceDataRouter;
