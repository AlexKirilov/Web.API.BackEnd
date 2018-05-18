let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let Customer = require('../models/Customers');
let express = require('express');
let customerRouter = express.Router();
let func = require('../func');
let variables = require('../var');

var Products = require('../models/store/Products');
var InvoiceDetails = require('../models/store/CustomerInvoiceDetails');

/* Level of Auth
// SA -> System Admin
// AD -> Admin
// MN -> Manager
// CU -> Customer
// GU -> Guest
 */


/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////

customerRouter.post('/login', async (req, res) => {
    let loginData = req.body;
    if (loginData && loginData.password && loginData.email && loginData.password != void 0 && loginData.email != void 0 && func.validateEmail(loginData.email)) {
        let customer = await Customer.findOne({ email: loginData.email }, '-__v -levelAuth -lastname')
        if (customer == void 0)
            return res.status(401).send(variables.errorMsg.type401.invalidCreds)

        bcrypt.compare(loginData.password, customer.password, (err, isMatch) => {
            if (!isMatch) {
                return res.status(401).send(variables.errorMsg.type401.invalidCreds)
            }
            func.createToken(res, customer); //TODO: Send and the FName
        });
    } else
        return res.status(401).send(variables.errorMsg.type401.invalidData);
});

customerRouter.post('/checkForUser', async (req, res) => {
    let userData = req.body;
    if (userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        let customer = await Customer.findOne({ email: userData.email })
        if (customer !== null) {
            return res.status(200).send({ exist: true })
        }
        res.status(200).send({ exist: false });
    } else {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
customerRouter.post('/register', async (req, res) => {
    let data = req.body;

    if (data && data.password && data.email && data.firstname && data.lastname
        && data.password != void 0 && data.email != void 0 && func.validateEmail(data.email)
    ) {
        // Check for existing email
        let isCustExist = await Customer.find({ email: data.email });
        if (isCustExist.length == 0) {
            //Set Optional fields to default values or null
            if (!data.GDPR) data.GDPR = false;
            if (!!!data.company) data.company = '';
            if (!!!data.type || data.type == '') data.type = 'user';

            switch (data.type) {
                case 'admin':
                    data.levelAuth = 'AD'; break;
                case 'manager':
                    data.levelAuth = 'MN'; break;
                case '':
                    data.levelAuth = 'CU'; break;
                case 'user':
                    data.levelAuth = 'CU'; break;
                case 'guest':
                    data.levelAuth = 'GU'; break;
            }

            let customer = new Customer(data);
            customer.save((err, result) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.type500.newUser)
                }
                func.createToken(res, result, variables.masterKey);
            });
        } else {
            return res.status(400).send({ message: 'Current Email address already exists!' })
        }
    } else
        return res.status(402).send(variables.errorMsg.type401.invalidData);
});
// TODO ONLY SYAdmin can Edit and Customer it SELF
//TODO: Edit / Change password / email
customerRouter.post('/editcustomer', func.checkAuthenticated, (req, res) => {
    let data = req.body;

    if (data && !!data.password && !!data.email && !!data.firstname && !!data.lastname && func.validateEmail(data.email)) {
        //Set Optional fields to default values or null
        if (!!!data.company || data.company == '') data.company = '';
        if (!!!data.type || data.type == '') data.type = 'user';

        data.siteOwner = '5afdc5fcd5192138388189c7' // TODO Delete me

        switch (data.type) {
            case 'admin':
                data.levelAuth = 'AD'; break;
            case 'manager':
                data.levelAuth = 'MN'; break;
            case 'user':
                data.levelAuth = 'CU'; break;
            case 'guest':
                data.levelAuth = 'GU'; break;
        }
        //TODO : change the way // Search by email and search by id
        let id = '5afdc5fcd5192138388189c7'

        Customer.findByIdAndUpdate(id, data, (err, result) => {
            if (!err) res.status(201).send(variables.successMsg.update);
            else res.status(500).send(variables.errorMsg.type500.notfound);
        });
    } else
        return res.status(402).send(variables.errorMsg.type401.invalidData);
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

// TODO ONLY SYAdmin can Edit and Customer it SELF
// Removing the Customer Delete all DB connected with the customer

// Invoice Details
// Invoices
// Products

customerRouter.post('/removecustomer', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    let method, path;
    try {
        let isCustExist = await Customer.find({ _id: req.userId });
        if (isCustExist.length == 1) {


            // Delete Customer Invoice Details
            let exist = await InvoiceDetails.find({ customer: req.userId });
            if (exist.length > 0) {
                InvoiceDetails.findByIdAndRemove(exist[0]._id, null, (err, result) => {
                    if (err) res.json(variables.errorMsg.type500.serverError);
                    console.log(result);
                });
            }

            // Delete Customer Products
            Products.remove({ customer: req.userId }).exec();

            // Delete Invoices
            // TODO: 

            // Delete Cusomer Account
            Customer.findByIdAndRemove(req.userId, data, (err, result) => {
                if (err) res.status(500).send(variables.errorMsg.type500.notfound);
                res.json({ message: `Customer ${variables.successMsg.remove.message}` })
            });
        } else {
            res.json(variables.errorMsg.type500.notfound)
        }
    } catch (err) {
        return res.status(500).send(variables.errorMsg.type500.remove);
    }
});

module.exports = customerRouter;