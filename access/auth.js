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

/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////

authRouter.post('/login', async (req, res) => {
    let loginData = req.body;
    if (loginData && loginData.password && loginData.email &&
        loginData.password != void 0 && loginData.email != void 0 &&
        loginData.password.trim() != '' && loginData.email.trim() != '' &&
        func.validateEmail(loginData.email)
    ) {
        let auth = await Auth.findOne({ email: loginData.email }, '-__v -firstname -lastname')
        if (auth == null)
            return res.status(400).send(variables.errorMsg.notfound); // Changed

        auth.lastLogin = func.currentDate();
        await Site.findById(auth.siteID, (err, resultData) => {
            bcrypt.compare(loginData.password, auth.password, (err, isMatch) => {
                if (!isMatch) {
                    return res.status(401).send(variables.errorMsg.unauthorized); // Changed
                }
                auth.save(auth, (err, newUser) => {
                    if (err) return res.status(500).send(variables.errorMsg.update); // Changed
                });
                func.createToken(res, auth, resultData);
            });
        });
    } else
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
});

authRouter.post('/checkForUser', (req, res) => {
    let userData = req.body;
    if (!!userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        Auth.findOne({ email: userData.email }, (err, results) => {
            if (err) return res.status(400).send(variables.errorMsg.notfound); // Changed
            res.json({ exist: (results !== null) });
        });
    } else {
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
    }
});

authRouter.get('/getAuth', func.checkAuthenticated, (req, res) => {
    if (!!req.userId && !!req.siteID && !!req.authLevel) {
        Auth.findById(req.userId, (err, rest) => {
            if (err)
                return res.status(400).send(variables.errorMsg.notfound); // Changed
            res.status(200).send(rest);
        });
    } else {
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////

authRouter.post('/register', async (req, res) => {
    let userData = req.body;

    if (userData && userData.password && userData.email && userData.siteName &&
        userData.password != void 0 && userData.email != void 0 && userData.siteName != void 0 &&
        userData.password.trim() != '' && userData.email.trim() != '' && userData.siteName.trim() != '' &&
        func.validateEmail(userData.email)
    ) {
        let isAuthExist = await Customer.find({ email: userData.email });
        let isCustExist = await Customer.find({ email: userData.email });

        if (isAuthExist.length == 0 && isCustExist.length == 0) {
            // Get Site Type ID
            let siteType
            if (!!userData.siteTypeID)
                siteType = await SiteType.find({ name: userData.siteTypeID }); // TODO: Look the siteTypeID
            else siteType = await SiteType.find({ name: '5b0428384953411bd455bb90' }); //Type Store
            // Create Site
            let sitePublicKey = func.generatePublicKey();
            let newsite = { name: userData.siteName, publicKey: sitePublicKey, type: siteType._id }
            // Creating new Site
            let site = new Site(newsite);
            site.save((err, newUser) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.created); // Changed
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
                    if (err)
                        return res.status(500).send(variables.errorMsg.update); // Changed
                    customer.save((err, newUser) => {
                        if (err)
                            return res.status(500).send(variables.errorMsg.update); // Changed
                    });
                    func.createToken(res, newUser, site);
                });
            });
        } else {
            return res.json(variables.errorMsg.exists); // Changed
        }
    } else {
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
    }
});

authRouter.post('/editAuth', func.checkAuthenticated, async (req, res) => {
    let userData = req.body;
    let tmpEmail;

    // TODO: This may need to be changed // Check by both emails and user id than update?
    if (!!req.userId && !!userData && !!req.authLevel && !!userData.email) {
        let isExist;
            if(!!userData.newEmail && userData.newEmail != '') {
                tmpEmail = userData.email;
                userData.email = userData.newEmail;
                isExist = await Auth.findOne({ email: userData.newEmail }, (err, results) => {
                    if (err) 
                        return res.status(400).send(variables.errorMsg.notfound); // Change
                    if (results !== null || results._id !== req.userId)
                        return res.status(200).json('This email is already taken!');
                });
            } else 
                tmpEmail = userData.email;
            // console.log(userData)
            // console.log({ _id: req.userId, email: userData.email })
            Auth.findOneAndUpdate({ _id: req.userId, email: userData.email }, userData, (err, doc, response) => {
                console.log(err, doc, response)
                if (err) return res.status(401).json('The old email is not recognized.')// err) // TODO: 
                if (doc) Customer.findOneAndUpdate({ email: userData.email }, userData, (err, doc, response) => {
                    console.log(err, doc, response)
                    if (err) return res.status(401).json('This is a second error') // err) // TODO: 
                    if (doc) return res.json(variables.successMsg.update);
                    else return res.status(401).json('The old email is not recognized.')
                });
                else return res.status(401).json('The old email is not recognized.')
            });
    } else {
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
    }
});

authRouter.post('/changeauthlevel', func.checkAuthenticated, async (req, res) => {

    let userData = req.body;
    if (!!req.userId && !!userData && !!req.levelAuth) {
        Auth.findById(req.userId, (err, rest) => {
            if (err || (rest.levelAuth !== 'AD' && rest.levelAuth !== 'SA')) {
                return res.status(401).send(variables.errorMsg.unauthorized); // Changed
            } else {
                Customer.findById(userData.customerID, (err, result) => {
                    if (err) {
                        return res.status(400).send(variables.errorMsg.notfound); // Changed
                    } else {
                        result.levelAuth = userData.levelAuth;
                        switch (userData.levelAuth) {
                            case 'AD': result.type = 'Admin'; break;
                            case 'MN': result.type = 'Manager'; break;
                            case 'EE': result.type = 'Employee'; break;
                            case 'CU': result.type = 'Customer'; break;
                        }
                        Customer.findByIdAndUpdate(userData.customerID, result, (err, result) => {
                            if (err) return res.json(variables.errorMsg.update); // Changed
                            res.status(200).send(variables.successMsg.update); // Changed
                        });
                    }
                });
            }
        })
    } else {
        return res.status(400).send(variables.errorMsg.invalidData); // Changed
    }
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

// TODO: Delete function if the user is SysAdmin for v2
// Removing the Auth will Delete all DB connected with the that customer
authRouter.post('/deleteauthuserandsitedata', func.checkAuthenticated, async (req, res) => {
    let data = req.body;
    if (!!data && !!req.userId && !!req.siteID) {
        Auth.findById(req.userId, (err, rest) => {
            if (rest != null) {
                if (!!err || (rest.levelAuth !== 'AD' && rest.levelAuth !== 'SA') || req.userId != rest._id) {
                    return res.status(400).send(variables.errorMsg.invalidData); // Changed
                } else {
                    try {
                        let msg = { success: '', err: '' }
                        // Delete all Products - not
                        Products.remove({ siteID: req.siteID }, err => err);

                        // Delete all Customers - not
                        Customer.remove({ siteID: req.siteID }, err => err);

                        // Delete all Invoices - not
                        Invoices.remove({ siteID: req.siteID }, err => err);

                        // Delete all Invoice Data - not
                        InvoiceCustomerData.remove({ siteID: req.siteID }, err => err);

                        // Delete Site Contacts Data - not
                        SiteContacts.remove({ siteID: req.siteID }, err => err);

                        // Delete Site - need to be tested
                        Site.findByIdAndRemove(req.siteID, (err, result) => {
                            if (err) msg.err = ` Web Site with ID: ${req.siteID} and`;
                            else msg.success = ``;
                        });

                        // Delete Auth Acc - need to be tested
                        Auth.findByIdAndRemove(req.userId, (err, result) => {
                            if (err) msg.err = `There was an error with deleting of the${msg.err} Auth account with ID: ${data.userId}! `;
                            else msg.success = `Database tables were successfully deleted! `;
                            res.json(msg);
                        });

                    } catch (err) {
                        return res.status(500).send(variables.errorMsg.remove); // Changed
                    }
                }
            } else {
                return res.json(variables.errorMsg.notfound); // Changed
            }
        });
    } else {
        return res.status(401).send(variables.errorMsg.unauthorized); // Changed
    }
});


module.exports = authRouter;