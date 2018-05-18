var InvoiceDetails = require('../models/store/CustomerInvoiceDetails');
var express = require('express');
var productRouter = express.Router();
var variables = require('../var');
var func = require('../func');

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////

productRouter.post('/cusInvoiceDetails', func.checkAuthenticated, async (req, res) => {
    //By Owner --- ????
    var data = req.body;
    if (data) {
        let result = await InvoiceDetails.find({ customer: req.userId }); // TODO: findon or find --> result should be aways only one per client / user
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

productRouter.post('/addCusInvoiceDetails', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    if (req.userId == void 0 || data.GDPR == 'false') {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    // Check if already exist and edit
    let exist = await InvoiceDetails.find({ customer: req.userId });
    if (exist.length > 0) {
        InvoiceDetails.findByIdAndUpdate(exist[0]._id, data, (err, result) => { //variables.successMsg.update
            if (!err) res.status(201).send(variables.successMsg.update);
            else res.status(500).send(variables.errorMsg.type500.serverError);
        });
    } else { // If not exist create new Invoice
        data.customer = req.userId;

        let newData = new InvoiceDetails(data);
        newData.save((err, result) => {
            if (err) {
                return res.status(500).send(variables.errorMsg.type500.serverError);
            }
            res.status(200).send(variables.successMsg.created);
        });
    }
});

/////////////////////////////////////////////////
/////////////////   REMOVE   ////////////////////
/////////////////////////////////////////////////

productRouter.post('/removeCusInvoiceDetails', func.checkAuthenticated, async (req, res) => {
    try {
        if (req.userId == void 0)
            return res.status(400).send(variables.errorMsg.type401.invalidData);

        let exist = await InvoiceDetails.find({ customer: req.userId });
        if (exist.length > 0) {
            InvoiceDetails.findByIdAndRemove(exist[0]._id, null, (err, result) => {
                if (!err) res.status(201).send(variables.successMsg.remove);
                else res.status(500).send(variables.errorMsg.type500.serverError);
            });
        } else
            return res.status(500).send(variables.errorMsg.type500.notfound);
    } catch (err) {
        return res.status(500).send(variables.errorMsg.type500.notfound);
    }
});

module.exports = productRouter;
