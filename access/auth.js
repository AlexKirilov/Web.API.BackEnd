let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let Customer = require('../models/Customers');
let Invoices = require('../models/store/Invoices');
let SiteContacts = require('../models/SiteContacts');
let Products = require('../models/store/Products');
let InvoiceCustomerData = require('../models/store/InvoiceCustomerData');
let SiteType = require('../models/SiteType');
let Site = require('../models/Site');
let Auth = require('../models/Auth');
let express = require('express');
let authRouter = express.Router();
let func = require('../func');
let variables = require('../var');

/* Level of Auth
// SA -> SysAdmin
// AD -> Admin
// MN -> Manager
// EE -> Employee
// CU -> Customer
// GU -> Guest
 */

// Last Login
// Created Account
authRouter.post('/login', async (req, res) => {
    let loginData = req.body;
    if (loginData && loginData.password && loginData.email &&
        loginData.password != void 0 && loginData.email != void 0 &&
        loginData.password.trim() != '' && loginData.email.trim() != '' &&
        func.validateEmail(loginData.email)
    ) {
        let auth = await Auth.findOne({ email: loginData.email }, '-__v -firstname -lastname')
        if (auth == void 0)
            return res.status(401).send(variables.errorMsg.type401.invalidCreds)

        auth.lastLogin = func.currentDate();
        await Site.findById(auth.siteID, (err, resultData) => {
            bcrypt.compare(loginData.password, auth.password, (err, isMatch) => {
                if (!isMatch) {
                    return res.status(401).send(variables.errorMsg.type401.invalidCreds);
                }
                auth.save(auth, (err, newUser) => {
                    if (err) return res.status(500).send(variables.errorMsg.type500.newUser)
                });
                func.createToken(res, auth, resultData);
            });
        });
    } else
        return res.status(401).send(variables.errorMsg.type401.invalidData);
});

authRouter.post('/register', async (req, res) => {
    let userData = req.body;
    if (userData && userData.password && userData.email && userData.siteName && userData.siteTypeID &&
        userData.password != void 0 && userData.email != void 0 && userData.siteName != void 0 && userData.siteTypeID != void 0 &&
        userData.password.trim() != '' && userData.email.trim() != '' && userData.siteName.trim() != '' && userData.siteTypeID.trim() != '' &&
        func.validateEmail(userData.email)
    ) {
        let isAuthExist = await Customer.find({ email: userData.email });
        let isCustExist = await Customer.find({ email: userData.email });
        if (isAuthExist.length == 0 && isCustExist.length == 0) {
            // Get Site Type ID
            let siteType = await SiteType.find({ name: userData.siteTypeID }); // TODO: Look the siteTypeID
            // Create Site
            let sitePublicKey = func.generatePublicKey();
            let newsite = { name: userData.siteName, publicKey: sitePublicKey, type: siteType._id }
            // Creating new Site
            let site = new Site(newsite);
            site.save((err, newUser) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.type500.newUser)
                }

                // Default Values for Auth Acc
                let auth = new Auth(userData);
                auth.levelAuth = 'AD'; // Should not be visible for the users
                auth.type = 'Admin'; // Visible for the customers
                auth.lastLogin = auth.created = func.currentDate();
                auth.GDPR = false;
                auth.siteID = site._id;


                // Create Web Site Account
                let customer = new Customer(userData);
                customer.levelAuth = 'MN'; // Should not be visible for the users
                customer.type = 'Manager'; // Visible for the customers
                customer.lastLogin = customer.created = func.currentDate();
                customer.GDPR = false;
                customer.siteID = site._id;

                // Create Web Site API ACC
                auth.save((err, newUser) => {
                    if (err) {
                        return res.status(500).send(variables.errorMsg.type500.newUser)
                    }
                    customer.save((err, newUser) => {
                        if (err) return res.status(500).send(variables.errorMsg.type500.newUser)
                    });
                    func.createToken(res, newUser, site);
                });
            });
        } else {
            return res.json({ message: 'Current Email address already exists!' });
        }
    } else {
        return res.status(401).send(variables.errorMsg.type500.invalidData);
    }
});

authRouter.post('/checkForUser', (req, res) => {
    let userData = req.body;
    if (!!userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        Auth.findOne({ email: userData.email }, (err, results) => {
            if (err) return res.status(500).send(variables.errorMsg.type500.serverError);
            res.json({ exist: (results !== null) });
        });
    } else {
        return res.status(401).send(variables.errorMsg.type500.invalidData);
    }
});

authRouter.post('/changeauthlevel', func.checkAuthenticated, async (req, res) => {

    let userData = req.body;
    if (!!req.userId && !!userData && !!req.levelAuth) {
        Auth.findById(req.userId, (err, rest) => {
            if (err || (rest.levelAuth !== 'AD' && rest.levelAuth !== 'SA')) {
                return res.status(401).send(variables.errorMsg.type401.invalidCreds);
            } else {
                Customer.findById(userData.customerID, (err, result) => {
                    if (err) {
                        return res.json({ message: 'Customer was not found' })
                    } else {
                        result.levelAuth = userData.levelAuth; //TODO Need to change with the real code
                        switch (userData.levelAuth) {
                            case 'AD': result.type = 'Admin'; break;
                            case 'MN': result.type = 'Manager'; break;
                            case 'EE': result.type = 'Employee'; break;
                            case 'CU': result.type = 'Customer'; break;
                        }
                        Customer.findByIdAndUpdate(userData.customerID, result, (err, result) => { //variables.successMsg.update
                            if (err) return res.json(variables.errorMsg.type500.update);
                            res.status(200).send({ message: 'Customers access level was updated successfully' });
                        });
                    }
                });
            }
        })
    } else {
        return res.status(401).send(variables.errorMsg.type500.invalidData);
    }
});
// TODO: Delete function if the user is SysAdmin
// TODO: Need to be tested with all data
// Removing the Customer Delete all DB connected with the customer
authRouter.post('/deleteauthuserandsitedata', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    if (!!data && !!req.userId && !!req.siteID) {
        console.log('tuk 1')
        Auth.findById(req.userId, (err, rest) => {
            if (rest != null) {
                if (!!err || (rest.levelAuth !== 'AD' && rest.levelAuth !== 'SA') || req.userId != rest._id) {
                    return res.status(401).send(variables.errorMsg.type401.invalidCreds);
                } else {
                    try {
                        console.log('tuk 3', req.siteID)
                        let msg = { success: '', err: '' }
                        // Delete all Products - not
                        Products.find({ siteID: req.siteID }, (err, re) => { console.log('Products ', re) });
                        Products.remove({ siteID: req.siteID }, err => console.log('success', err));

                        // Delete all Customers - not
                        Customer.find({ siteID: req.siteID }, (err, re) => { console.log('Customer ', re) });
                        Customer.remove({ siteID: req.siteID }, err => console.log('success', err));

                        // Delete all Invoices - not
                        Invoices.find({ siteID: req.siteID }, (err, re) => { console.log('Invoices ', re) });
                        Invoices.remove({ siteID: req.siteID }, err => console.log('success', err));

                        // Delete all Invoice Data - not
                        InvoiceCustomerData.find({ siteID: req.siteID }, (err, re) => { console.log('InvoiceCustomerData ', re) });
                        InvoiceCustomerData.remove({ siteID: req.siteID }, err => console.log('success', err));

                        // Delete Site Contacts Data - not
                        SiteContacts.find({ siteID: req.siteID }, (err, re) => { console.log('SiteContacts ', re) });
                        SiteContacts.remove({ siteID: req.siteID }, err => console.log('success', err));

                        // Delete Site - need to be tested
                        Site.findByIdAndRemove(req.siteID, (err, result) => {
                            if (err) msg.err = `${msg.err} There was an error with deleting the Web Site with ID: ${req.siteID}! `;
                            else msg.success = `${msg.success} Site was successfully deleted! `;
                        });

                        // Delete Auth Acc - need to be tested
                        Auth.findByIdAndRemove(req.userId, (err, result) => {
                            if (err) msg.err = `${msg.err} There was an error with deleting the Auth account with ID: ${data.userId}! `;
                            else msg.success = `${msg.success} Auth account was successfully deleted! `;
                            res.json(msg);
                        });

                    } catch (err) {
                        console.log('tuk 4')
                        return res.status(500).send(variables.errorMsg.type500.remove);
                    }
                }
            } else {
                res.json(variables.errorMsg.type500.notfound);
            }
        });
    } else {
        console.log('tuk 5')
        return res.status(401).send(variables.errorMsg.type500.invalidData);
    }
});


module.exports = authRouter;