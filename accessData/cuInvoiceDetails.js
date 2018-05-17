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
////////////////////////////////////////////////

productRouter.post('/addCusInvoiceDetails', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    if (req.userId == void 0 || (data.name == void 0 || data.name.trim() == '') || !data.GDPR) {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    // Check if already exist and edit
    let exist = await InvoiceDetails.findOne({ customer: req.userId });
    if (!!exist) {
        exist.save((err, result) => {
            if (err) {
                return res.status(500).send(variables.errorMsg.type500.serverError);
            }
            res.status(200).send(variables.successMsg.webtype); //TODO: change message // Updated
        });
    } else { // If not exist create new Invoice
        data.user = req.userId;

        let newData = new InvoiceDetails(data);
        newData.save((err, result) => {
            if (err) {
                return res.status(500).send(variables.errorMsg.type500.serverError);
            }
            res.status(200).send(variables.successMsg.webtype); //TODO: change message
        });
    }
});

module.exports = productRouter;