var InvoiceCustomerData = require('../models/store/InvoiceCustomerData');
var Invoices = require('../models/store/Invoices');
var Customers = require('../models/Customers');
var express = require('express');
var InvoiceRouter = express.Router();
var variables = require('../var');
var func = require('../func');
//READY

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
// TODO: secure the invoices results
InvoiceRouter.get('/invoices', func.checkAuthenticated, async (req, res) => {
    //Only Admin and Manager can check the data
    if (!!!req.siteID || !!!req.userId) {
        return res.status(400).send(variables.errorMsg.invalidData);
    }

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
        if (result.length == 0) {
            return res.status(200).send({ message: 'There are no invoices found!' })
        }

        if (req.userId == result.customerInvoiceID || req.authLevel == 'AD' || req.authLevel == 'MN') {
            res.send(result);
        } else {
            return res.status(401).send(variables.errorMsg.unauthorized);
        }
    } else {
        return res.status(500).send('Customer Invoice Details -> ' + variables.errorMsg.serverError);
    }
});


/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
// Requires data --> By Customer/Employee (level CU or EE) If edit need  {invoiceID}
// Requires data --> By Admin or Manager or Employee { customerID } If Edit need {invoiceID}
// TODO: Maybe need to be change the conditions of creation for v2 // data Update or creation access levels
InvoiceRouter.post('/addOrEditInvoice', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    if (!!!req.userId || !!!req.siteID || !!!req.authLevel) {
        return res.status(400).send(variables.errorMsg.invalidData);
    }

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
                let newInvoice = new Invoices(data);
                newInvoice.save((err, result) => {
                    if (err)
                        return res.status(500).send(variables.errorMsg.serverError);
                    return res.status(200).send(variables.successMsg.created);
                });
            } else {
                data.customerInvoiceID = invoiceData.customerInvoiceID;
                if (!!data.invoiceID) {
                    Invoices.findByIdAndUpdate(data.invoiceID, data, (err, update) => {
                        if (err) return res.json({ message: 'There was an error while updating the Invoice data' });
                        return res.status(200).json({ data: update, message: 'Invoice data was successfully updated' }); // Sending the updated request call.
                    });
                } else {
                    return res.status(500).send(variables.errorMsg.serverError);
                }
            }
        });
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
                        let newInvoice = new Invoices(data);
                        newInvoice.save((err, result) => {
                            if (err)
                                return res.status(500).send(variables.errorMsg.serverError);
                            return res.status(200).send(variables.successMsg.created);
                        });
                    } else {
                        data.customerInvoiceID = invoiceData.customerInvoiceID;
                        if (!!data.invoiceID) {
                            Invoices.findByIdAndUpdate(data.invoiceID, data, (err, update) => {
                                if (err) return res.json({ message: 'There was an error while updating the Invoice data' });
                                return res.status(200).json({ data: update, message: 'Invoice data was successfully updated' }); // Sending the updated request call.
                            });
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
    let data = req.body;
    try {
        if (!!!req.siteID)
            return res.status(400).send(variables.errorMsg.invalidData);

        if (!!!data.all) data.all = false;

        // Remove all by web site
        // If all = true, InvoiceID and CustomerID are null or empty
        if (data.all && !!!data.invoiceID && !!!data.cutomerID && (req.authLevel == 'AD' || req.authLevel == 'MN')) {
            Invoices.remove({ siteID: req.siteID });

            // Remove all by customer ID
        } else if (data.all && !!data.cutomerID && !!!data.invoiceID && (req.authLevel == 'AD' || req.authLevel == 'MN')) {
            let id = (!!data.cutomerID) ? data.cutomerID : req.userId;
            Invoices.remove({ siteID: req.siteID, customerID: id });

            //Remove by Invoice ID
        } else if (!data.all && !!data.invoiceID) {
            Invoices.findByIdAndRemove(data.invoiceID, (err, results) => {
                if (err) return res.status(500).send(variables.errorMsg.notfound);
            });
        } else {
            return res.status(200).json({ message: 'There was no data for deleting' });
        }
        res.status(200).json(variables.successMsg.remove);

    } catch (err) {
        return res.status(500).send(variables.errorMsg.notfound);
    }
});

module.exports = InvoiceRouter;
