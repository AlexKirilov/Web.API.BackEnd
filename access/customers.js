let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let Customers = require('../models/Customers');
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
// EE -> Employee
// CU -> Customer
// GU -> Guest
 */

// TODO: Get customers by Site
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
        let customer = await Customers.findOne({ email: loginData.email }, '-__v -GDPR -created');
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
            Customers.findByIdAndUpdate(customer._id, customer, (err, result) => { //variables.successMsg.update
                if (err) return res.json(variables.errorMsg.type500.update);
            });

            func.createToken(res, customer, siteData); //TODO: Send and the FName / LName
        });
    } else
        return res.status(401).send(variables.errorMsg.type401.invalidData);
});
//{ "email": "admin@mail.com"}
customerRouter.post('/checkForUser', async (req, res) => {
    let userData = req.body;
    if (userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        let customer = await Customers.findOne({ email: userData.email })
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
                if (err) {
                    return res.status(500).send(variables.errorMsg.type500.newUser)
                }
                func.createToken(res, result, siteData);
            });
        } else {
            return res.json({ message: 'Email address is already taken!' })
        }
    } else
        return res.status(400).send(variables.errorMsg.type401.invalidData);
});

customerRouter.post('/editcustomer', func.checkAuthenticated, (req, res) => {
    let data = req.body;
    if (!!data && !!data.password && !!data.email && func.validateEmail(data.email)) {
        Customers.findByIdAndUpdate(req.userId, data, (err, result) => {
            if (!err) res.status(200).send(result);
            else res.status(500).send(variables.errorMsg.type500.notfound);
        });
    } else
        return res.status(400).send(variables.errorMsg.type401.invalidData);
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////
// TODO Changes here

// DELETE Customers by self
// DELETE from Admin or Manager by CustomersID or Customers Email
customerRouter.post('/deletecustomer', func.checkAuthenticated, (req, res) => {
    let data = req.body;
    if (!!!req.siteID || !!!req.userId || !!!req.authLevel)
        return res.status(500).json({ message: 'Unauthorized' });

    if (req.levelAuth == 'CU') {
        Customers.findByIdAndRemove(req.userId, (err, removed) => {
            if (!err) return res.status(200).send(variables.successMsg.remove);
            else return res.status(500).send(variables.errorMsg.type500.notfound);
        });
    } else if ((!!data.customerID || !!data.email) && (req.authLevel == 'AD' || req.authLevel == 'MN')) {
        let by = {}
        console.log('IN 4')
        if (!!data.customerID) by._id = data.customerID;
        if (!!data.email) by.email = data.email;
        console.log('search by: ', by)
        Customers.find(by, (err, results) => {
            console.log('results', results)
            if (err)
                return res.status(500).json(variables.errorMsg.type500.serverError);
            if (results.length == 0)
                return res.status(200).json({ message: 'There are no Customers found with this ID!' });
            else {
                Customers.remove(by, (err, removed) => {
                    return res.status(200).json({ message: 'Customer was successfully deleted' });
                });
            }
        });
    } else {
        console.log('IN 5')
        return res.json(variables.errorMsg.type401.invalidData);
    }
});

module.exports = customerRouter;