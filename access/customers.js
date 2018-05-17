let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let Customer = require('../models/Customers');
let express = require('express');
let customerRouter = express.Router();
let func = require('../func');
let variables = require('../var');

/* Level of Auth
// SA -> System Admin
// AD -> Admin
// MN -> Manager
// CU -> Customer
// GU -> Guest
 */

customerRouter.post('/register', (req, res) => {
    let data = req.body;

    if (data && data.password && data.email && data.firstname && data.lastname
        && data.password != void 0 && data.email != void 0 && func.validateEmail(data.email)
    ) {
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
            //func.createToken(res, newUser);
            res.status(200).send(result)
        });
    }
});

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
        // TODO Check if it`s edit the data
        data.save((err, result) => {
            if (err) {
                return res.status(500).send(variables.errorMsg.type500.newUser)
            }
            func.createToken(res, result);
        });
    }
});

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

module.exports = customerRouter;