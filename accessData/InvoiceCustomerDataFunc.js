var InvoiceCustomerData = require('../models/store/InvoiceCustomerData');
var express = require('express');
var invoiceDataRouter = express.Router();
var variables = require('../var');
var func = require('../func');

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////

invoiceDataRouter.post('/cusInvoiceDetails', func.checkAuthenticated, async (req, res) => {
    var data = req.body;
    if (!!data && !!req.siteID && !!req.userId) {
        let result = await InvoiceCustomerData.find({ siteID: req.siteID, customerID: req.userId }, (err, results) => {
            if (err) return res.status(500).send(variables.errorMsg.type500.serverError);
            if (result.length == 0) {
                return res.status(200).send({ message: 'Data was not found!' })
            }
            res.status(200).send(result);
        });
    } else {
        return res.status(500).send('Customer Invoice Details -> ' + variables.errorMsg.type500.serverError);
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////

invoiceDataRouter.post('/addOrEditCusInvoiceDetails', func.checkAuthenticated, (req, res) => {
    let data = req.body;
    if (!!!data || !!!req.userId || !!!req.siteID || data.GDPR == 'false') {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    InvoiceCustomerData.find({ siteID: req.siteID, customerID: req.userId }, (err, results) => {
        if (err) return res.status(500).send(variables.errorMsg.type500.serverError);
        if (!!results && results.length > 0) {
            InvoiceCustomerData.findByIdAndUpdate(results._id, data);
        } else {
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

// TODO: chack deletion
invoiceDataRouter.post('/removeCusInvoiceDetails', func.checkAuthenticated, async (req, res) => {
    InvoiceCustomerData.remove({ siteID: req.siteID, customerID: req.userId }, err => res.status(400).send(variables.errorMsg.type401.invalidData));
});

module.exports = invoiceDataRouter;
