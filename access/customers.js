var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');
var Customer = require('../models/Customers');
var express = require('express');
var customerRouter = express.Router();
var func = require('../func');
var variables = require('../var');

/* Level of Auth
// SA -> System Admin
// AD -> Admin
// MN -> Manager
// CU -> Customer
// GU -> Guest
 */

customerRouter.post('/register', (req, res) => {
    var userData = req.body;

    if (userData && userData.password && userData.email && userData.firstname && userData.lastname
        && userData.password != void 0 && userData.email != void 0 && func.validateEmail(userData.email)
    ) {
        //Set Optional fields to default values or null
        if (!userData.GDPR == void 0 || userData.GDPR == '') userData.GDPR = false;
        if (!userData.company == void 0 || userData.company == '') userData.company = '';
        if (customer.type == void 0 || customer.type == '') customer.type = 'user';

        switch (userData.type) {
            case 'admin':
                customer.levelAuth = 'AD'; break;
            case 'manager':
                customer.levelAuth = 'MN'; break;
            case 'user':
                customer.levelAuth = 'CU'; break;
            case 'guest':
                customer.levelAuth = 'GU'; break;
        }

        var customer = new Customer(userData);
        customer.save((err, newUser) => {
            if (err) {
                return res.status(500).send(variables.errorMsg.type500.newUser)
            }
            func.createToken(res, newUser);
        });
    }
});

customerRouter.post('/login', async (req, res) => {
    var loginData = req.body;
    if (loginData && loginData.password && loginData.email && loginData.password != void 0 && loginData.email != void 0 && func.validateEmail(loginData.email)) {
        var customer = await Customer.findOne({ email: loginData.email }, '-__v -levelAuth -lastname')
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
    var userData = req.body;
    if (userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        var customer = await Customer.findOne({ email: userData.email })
        if (customer !== null) {
            return res.status(200).send({ exist: true })
        }
        res.status(200).send({ exist: false });
    }
});

module.exports = customerRouter;