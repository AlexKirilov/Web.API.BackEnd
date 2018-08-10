const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const func = require('../func');
const variables = require('../var');
const Site = require('../models/Site');
const bcrypt = require('bcrypt-nodejs');
const Auth = require('../models/Auth');
const Customers = require('../models/Customers');
const SiteLogs = require('../models/SiteLogs');
const express = require('express');
const customerRouter = express.Router();
//Customer password should be possible to be changed
/* Level of Auth
// AD -> Admin
// MN -> Manager
// EE -> Employee
// CU -> Customer
 */

function logMSG(data) {
    new SiteLogs(data).save();
}

/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
//Required data for this call -> { "password":"password", "email": "mail@mail.com" }
customerRouter.post('/login', [
    check('email').isString().isEmail().normalizeEmail(),
    check('password').isString().trim().isLength({ min: 5 }).escape(),
    sanitizeBody('notifyOnReply').toBoolean()
], async (req, res) => {
    // func.validateEmail(loginData.email) // TODO: Do I need to check it 

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const loginData = req.body;

        const customer = await Customers.findOne({ email: loginData.email }, '-__v -GDPR -created');
        if (customer == void 0)
            return res.status(404).send(variables.errorMsg.notfound); // Changed

        //Getting Site Data
        const siteData = await Site.findOne({ _id: customer.siteID }, '-__v -name');

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
            // TODO: Do i Need that kind of logs ???
            // new SiteLogs({
            //     level: 'information',
            //     message: `User with ID '${customer._id}' logged in successfully`,
            //     sysOperation: 'login',
            //     sysLevel: 'auth'
            // }).save();

            func.createToken(res, customer, siteData); //TODO: Send and the FName / LName for v2
        });
    }
});

//Required data for this call -> { "email": "mail@mail.com" }
customerRouter.post('/checkForUser', (req, res) => {
    check('email').isString().isEmail().normalizeEmail();
    sanitizeBody('notifyOnReply').toBoolean();
    // TODO: func.validateEmail(userData.email)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const userData = req.body;
        Customers.findOne({ email: userData.email }).exec()
            .then(result => {
                res.status(200).send({ exists: (result !== null) ? true : false });
            }).catch(err => {
                // Add new Log
                logMSG({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'check',
                    sysLevel: 'customer'
                });
                res.status(500).json({ error: err });
            });
    }
});

//Required data for this call -> { "email": "mail@mail.com" }
customerRouter.get('/getCustomer', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Customers.findOne({ siteID: req.siteID, _id: req.userId })
            .exec()
            .then(result => { if (customer !== null) res.status(200).send(result); })
            .catch(err => {
                // Add new Log
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'customer'
                });
                res.status(500).json({ error: err });
            });
    }
});

//Required data for this call -> { "email": "mail@mail.com" }
customerRouter.get('/getAuthCustomer', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findOne({ siteID: req.siteID, _id: req.userId }).exec()
            .then(auth => {
                if (auth !== null) {
                    Customers.findOne({ siteID: req.siteID, email: auth.email }).exec()
                        .then(customer => {
                            if (customer !== null) { res.status(200).send(customer); }
                            else { res.status(404).send(variables.errorMsg.notfound); }
                        })
                } else {
                    res.status(404).send(variables.errorMsg.notfound);
                }
            })
            .catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'customer'
                });
                res.status(500).json({ error: err });
            });
    }
});

customerRouter.get('/getEmployees', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 }).equals('AD'); // .withMessage('AD')
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findOne({ siteID: req.siteID, _id: req.userId }).exec()
            .then(auth => {
                if (auth !== null) {
                    Customers.find({ siteID: req.siteID }, '-__v -password -siteID -created -GDPR -company').exec()
                        .then(result => {
                            res.status(200).send(result.filter(user => {
                                return user.levelAuth == 'EE' || user.levelAuth == 'MN';
                            }));
                        });
                }
            }).catch(err => {
                // Add new Log
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'employee'
                });
                res.status(500).json({ error: err });
            });

    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
// Update Employee only from Site Admin
customerRouter.post('/updateEmployee', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 }).equals('AD'); // .withMessage('AD')
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const data = req.body;
        Auth.findOne({ siteID: req.siteID, _id: req.userId }).exec()
            .then(auth => {
                if (auth !== null) {
                    Customers.findOneAndUpdate({ _id: data._id, siteID: req.siteID }, data)
                        .then(() => {
                            res.status(200).send(variables.successMsg.update);
                        });
                } else {
                    return res.status(404).send(variables.errorMsg.notfound)
                }
            }).catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'update',
                    sysLevel: 'employee'
                });
                res.status(500).json({ error: err });
            });
    }
});

// As minimum required data for this call -> { "password":"password", "email": "mail@mail.com" }
customerRouter.post('/register', func.getSiteID, async (req, res) => {
    check('email').isEmail().normalizeEmail();
    check('password').isString().trim().isLength({ min: 5 }).escape();
    // TODO: func.validateEmail(data.email);
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const data = req.body;
        // Check for existing email
        Customers.findOne({ email: data.email }).exec()
            .then(customer => {
                if (customer === null || customer.length === 0) {
                    //Set Optional fields to default values or null
                    if (!!!data.type || data.type == '') {
                        data.type = 'user';
                        data.levelAuth = 'CU';
                    }
                    data.siteID = req.siteID;
                    // Get Site Data
                    Site.findOne({ _id: req.siteID }, '-__v -name').exec()
                        .then(siteData => {
                            new Customers(data).save()
                                .then(result => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: result._id,
                                        level: 'information',
                                        message: `New Customer was created with ID '${result._id}' for web site ID '${req.siteID}'`,
                                        sysOperation: 'create',
                                        sysLevel: 'customer'
                                    });
                                    func.createToken(res, result, siteData);
                                });
                        });
                } else {
                    res.status(401).json(variables.errorMsg.exists) // { message: 'Email address is already taken!' } // Changed
                }
            }).catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: null,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'create',
                    sysLevel: 'customer'
                });
                res.status(500).json({ error: err });
            });
    }
});

// As minimum required data for this call -> { "password":"password", "email": "mail@mail.com" }
customerRouter.post('/editcustomer', [
    check('email').isEmail().normalizeEmail(),
    check('password').isString().trim().isLength({ min: 5 }).escape(),
], func.checkAuthenticated, (req, res) => {
    // TODO: func.validateEmail(data.email);
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Customers.findByIdAndUpdate(req.userId, req.body)
            .then((result) => {
                if (result.length > 0) { res.status(200).send(result); }
                else { res.status(400).send(variables.errorMsg.notfound); }
            }).catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'update',
                    sysLevel: 'customer'
                });
                res.status(500).json({ error: err });
            });
    }
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

// DELETE Customers by them self`s required data {} - NaN
// DELETE from Admin or Manager by CustomersID or Customers Email required data {customerID or email} - NaN
customerRouter.post('/deletecustomer', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 }); // .withMessage('AD')
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const data = req.body;
        if (req.levelAuth == 'CU') {
            Customers.findByIdAndRemove(req.userId).then(() => {
                logMSG({ // Add new Log
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'information',
                    message: `Customer with ID '${req.userId}' was successfully removed from web site with ID '${req.siteID}'.`,
                    sysOperation: 'delete',
                    sysLevel: 'customer'
                });
                res.status(200).send(variables.successMsg.remove);
            }).catch(err => {
                logMSG({ // Add new Log
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'delete',
                    sysLevel: 'customer'
                });
                res.status(500).json({ error: err });
            });
        } else if ((!!data.customerID || !!data.email) && (req.authLevel == 'AD' || req.authLevel == 'MN')) {
            let by = {}
            if (!!data.customerID) by._id = data.customerID;
            if (!!data.email) by.email = data.email;
            Customers.find(by).exec()
                .then(results => {
                    if (results.length == 0) { res.status(200).json(variables.errorMsg.notfound); } //{ message: 'There are no Customers found with this ID!' }
                    else {
                        Customers.remove(by).then(() => {
                            logMSG({ // Add new Log
                                siteID: req.siteID,
                                customerID: req.userId,
                                level: 'information',
                                message: `Customer was successfully removed from customer with ID '${req.userId}' for web site with ID '${req.siteID}'.`,
                                sysOperation: 'delete',
                                sysLevel: 'customer'
                            });
                            res.status(200).json(variables.successMsg.remove);
                        });
                    }
                }).catch(err => {
                    logMSG({ // Add new Log
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'error',
                        message: func.onCatchCreateLogMSG(err),
                        sysOperation: 'delete',
                        sysLevel: 'customer'
                    });
                    res.status(500).json({ error: err });
                });
        }
    }
});

module.exports = customerRouter;