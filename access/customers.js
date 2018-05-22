let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let Customer = require('../models/Customers');
let Site = require('../models/Site');
let express = require('express');
let customerRouter = express.Router();
let func = require('../func');
let variables = require('../var');

let Products = require('../models/store/Products');
// let InvoiceCustomerData = require('../models/store/InvoiceCustomerData');

/* Level of Auth
// SA -> SysAdmin
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
    if (loginData && loginData.password && loginData.email &&
        loginData.password != void 0 && loginData.email != void 0 &&
        loginData.password.trim() != '' && loginData.email.trim() != '' &&
        func.validateEmail(loginData.email)
    ) {
        let customer = await Customer.findOne({ email: loginData.email }, '-__v -levelAuth -GDPR -created');
        if (customer == void 0)
            return res.status(401).send(variables.errorMsg.type401.invalidCreds)

        //Getting Site Data
        let siteData = await Site.findOne({ _id: customer.siteID }, '-__v -name');

        //Creating the token and the auth data
        bcrypt.compare(loginData.password, customer.password, (err, isMatch) => {
            if (!isMatch) {
                return res.status(401).send(variables.errorMsg.type401.invalidCreds)
            }

            //Save the login time
            customer.lastLogin = func.currentDate();
            Customer.findByIdAndUpdate(customer._id, customer, (err, result) => { //variables.successMsg.update
                if (err) return res.json(variables.errorMsg.type500.update);
            });

            func.createToken(res, customer, siteData); //TODO: Send and the FName / LName
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
    if (data && data.password && data.email &&
        data.password != void 0 && data.email != void 0 &&
        loginData.password.trim() != '' && loginData.email.trim() != '' &&
        func.validateEmail(data.email)
    ) {
        // Check for existing email
        let isCustExist = await Customer.find({ email: data.email });
        if (isCustExist.length == 0) {
            //Set Optional fields to default values or null
            if (!data.GDPR) data.GDPR = false;
            if (!!!data.company) data.company = '';
            if (!!!data.type || data.type == '') {
                data.type = 'user';
                data.levelAuth = 'CU';
            }


            //TODO How to recognize the WebSite data ......?????
            data.lastLogin = data.created = func.currentDate();
            //Getting Site Data
            let siteData = await Site.findOne({ _id: isCustExist.siteID }, '-__v -name');

            let customer = new Customer(data);
            customer.save((err, result) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.type500.newUser)
                }
                func.createToken(res, result, siteData);
            });
        } else {
            return res.json({ message: 'Current Email address already exists!' })
        }
    } else
        return res.status(402).send(variables.errorMsg.type401.invalidData);
});

customerRouter.post('/editcustomer', func.checkAuthenticated, (req, res) => {
    let data = req.body;
    if (data && !!data.password && !!data.email && !!data.firstname && !!data.lastname && func.validateEmail(data.email)) {
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
//TODO Changes here
customerRouter.post('/deletecustomer', func.checkAuthenticated, (req, res) => {
    let data = req.body;
    let isCustomer = Customer.findById(req.userId, (err, result) => {
        if (err) return res.json(variables.errorMsg.notfound);
        else if (result.type == 'CU') {
            Customer.findByIdAndRemove(req.userId, (err, removed) => {
                if (!err) res.status(200).send(variables.successMsg.remove);
                else return res.status(500).send(variables.errorMsg.type500.notfound);
            });
        }
    });
});

module.exports = customerRouter;