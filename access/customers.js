let func = require('../func');
let jwt = require('jwt-simple');
let variables = require('../var');
let Site = require('../models/Site');
let bcrypt = require('bcrypt-nodejs');
let Customers = require('../models/Customers');
let express = require('express');
let customerRouter = express.Router();
//Customer password should be possible to be changed
/* Level of Auth
// AD -> Admin
// MN -> Manager
// EE -> Employee
// CU -> Customer
 */

/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
//Required data for this call -> { "password":"password", "email": "mail@mail.com" }
customerRouter.post('/login', async (req, res) => {
    let loginData = req.body;
    if (loginData && loginData.password && loginData.email &&
        loginData.password != void 0 && loginData.email != void 0 &&
        loginData.password.trim() != '' && loginData.email.trim() != '' &&
        func.validateEmail(loginData.email)
    ) {
        let customer = await Customers.findOne({ email: loginData.email }, '-__v -GDPR -created');
        if (customer == void 0)
            return res.status(400).send(variables.errorMsg.notfound); // Changed

        //Getting Site Data
        let siteData = await Site.findOne({ _id: customer.siteID }, '-__v -name');

        //Creating the token and the auth data
        bcrypt.compare(loginData.password, customer.password, (err, isMatch) => {
            if (!isMatch) {
                return res.status(401).send(variables.errorMsg.unauthorized); // Changed
            }

            //Save the login time
            customer.lastLogin = func.currentDate();
            Customers.findByIdAndUpdate(customer._id, customer, (err, result) => { //variables.successMsg.update
                if (err) return res.json(variables.errorMsg.update); // Changed
            });

            func.createToken(res, customer, siteData); //TODO: Send and the FName / LName for v2
        });
    } else
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
});

//Required data for this call -> { "email": "mail@mail.com" }
customerRouter.post('/checkForUser', async (req, res) => {
    let userData = req.body;
    if (userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        let customer = await Customers.findOne({ email: userData.email })
        if (customer !== null)
            return res.status(200).send({ exists: true });
        return res.status(200).send({ exists: false });
    } else {
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
// As minimum required data for this call -> { "password":"password", "email": "mail@mail.com" }
customerRouter.post('/register', func.getSiteID, async (req, res) => {
    let data = req.body;
    if (req.siteID && data && data.password && data.email &&
        data.password != void 0 && data.email != void 0 &&
        data.password.trim() != '' && data.email.trim() != '' &&
        func.validateEmail(data.email)
    ) {
        // Check for existing email
        let isCustExist = await Customers.findOne({ email: data.email });
        if (isCustExist == null) {
            //Set Optional fields to default values or null
            if (!!!data.GDPR) data.GDPR = false;
            if (!!!data.company) data.company = '';
            if (!!!data.type || data.type == '') {
                data.type = 'user';
                data.levelAuth = 'CU';
            }
            data.siteID = req.siteID;
            data.lastLogin = data.created = func.currentDate();
            // Get Site Data
            let siteData = await Site.findOne({ _id: req.siteID }, '-__v -name');
            let customer = new Customers(data);
            customer.save((err, result) => {
                if (err)
                    return res.status(500).send(variables.errorMsg.update); // Changed
                func.createToken(res, result, siteData);
            });
        } else {
            return res.json(variables.errorMsg.exists) // { message: 'Email address is already taken!' } // Changed
        }
    } else
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
});

// As minimum required data for this call -> { "password":"password", "email": "mail@mail.com" }
customerRouter.post('/editcustomer', func.checkAuthenticated, (req, res) => {
    let data = req.body;
    if (!!data && !!data.password && !!data.email && func.validateEmail(data.email)) {
        Customers.findByIdAndUpdate(req.userId, data, (err, result) => {
            if (!err) return res.status(200).send(result);
            else return res.status(400).send(variables.errorMsg.notfound); // Changed
        });
    } else
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

// DELETE Customers by them self`s required data {} - NaN
// DELETE from Admin or Manager by CustomersID or Customers Email required data {customerID or email} - NaN
customerRouter.post('/deletecustomer', func.checkAuthenticated, (req, res) => {
    let data = req.body;
    if (!!!req.siteID || !!!req.userId || !!!req.authLevel)
        return res.status(401).send(variables.errorMsg.unauthorized); // Changed

    if (req.levelAuth == 'CU') {
        Customers.findByIdAndRemove(req.userId, (err, removed) => {
            if (!err) return res.status(200).send(variables.successMsg.remove); // Changed
            else return res.status(404).send(variables.errorMsg.notfound); // Changed
        });
    } else if ((!!data.customerID || !!data.email) && (req.authLevel == 'AD' || req.authLevel == 'MN')) {
        let by = {}
        if (!!data.customerID) by._id = data.customerID;
        if (!!data.email) by.email = data.email;
        Customers.find(by, (err, results) => {
            if (err)
                return res.status(400).send(variables.errorMsg.notfound); // Changed
            if (results.length == 0)
                return res.status(200).json(variables.errorMsg.notfound); //{ message: 'There are no Customers found with this ID!' }
            else {
                Customers.remove(by, (err, removed) => {
                    return res.status(200).json(variables.successMsg.remove); // Changed
                });
            }
        });
    } else {
        return res.status(401).send(variables.errorMsg.unauthorized); // Changed
    }
});

module.exports = customerRouter;