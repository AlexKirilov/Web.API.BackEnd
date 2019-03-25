const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const bcrypt = require('bcrypt-nodejs');
const SiteLogs = require('../models/SiteLogs');
const Customer = require('../models/Customers');
const Invoices = require('../models/store/Invoices');
const SiteContacts = require('../models/SiteContacts');
const Products = require('../models/store/Products');
const InvoiceCustomerData = require('../models/store/InvoiceCustomerData');
const SiteType = require('../models/SiteType');
const Logs = require('../models/SiteLogs');
const Site = require('../models/Site');
const Auth = require('../models/Auth');
const express = require('express');
const authRouter = express.Router();
const func = require('../func');
const variables = require('../var');

/* Level of Auth
// SA -> SysAdmin
// AD -> Admin
// MN -> Manager
// EE -> Employee
// CU -> Customer
// GU -> Guest
 */

function logMSG(data) {
    new SiteLogs(data).save();
}
/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
// on find function .select('name price ...')
// .exec() - to convert the call in real promise
/* .then(ress => () {
    // Adding meta data
    if(ress) {
        const response = {
            count: ress.length
            results: ress.map( r =>{
                return {
                    name: r.name,
                    price: r.price,
                    _id: r._id,
                    request: {
                        type: 'GET',
                        url: 'http://..../products/' + r._id --> this will show the product ... url link for easy access
                    }
                }
            });
        }
    } else {
        res.status(404)
        .json({ message: 'No valid entry found for provided ID'})
    }
})
*/
// .catch(err => { res.status(500).json({error: err})})

authRouter.post('/login', [
    check('email').isString().isEmail().normalizeEmail(),
    check('password').isString().trim().isLength({ min: 5 }).escape(),
    sanitizeBody('notifyOnReply').toBoolean()
], (req, res) => {
    // Do I need to check it func.validateEmail(loginData.email)
    const loginData = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findOne({ email: loginData.email }) //, '-__v -firstname -lastname');
            .select('lastLogin siteID password levelAuth _id')
            .exec()
            .then(auth => {
                if (!auth) { res.status(404).send(variables.errorMsg.notfound); }
                else {
                    auth.lastLogin = func.currentDate();
                    Site.findById(auth.siteID)
                        .exec()
                        .then(resultData => {
                            if (!resultData) { res.status(404).json({ message: 'No valid entry found for provided Email' }); }
                            else {
                                bcrypt.compare(loginData.password, auth.password, (err, isMatch) => {
                                    if (!isMatch) {
                                        return res.status(401).send(variables.errorMsg.unauthorized); // Changed
                                    } else {
                                        auth.update(auth, (err, newUser) => {
                                            if (err) return res.status(500).send(variables.errorMsg.update); // Changed
                                        });
                                        logMSG({
                                            level: 'information',
                                            message: `User with ID '${auth.id}' logged in successfully`,
                                            sysOperation: 'login',
                                            sysLevel: 'auth'
                                        });
                                        func.createToken(res, auth, resultData);
                                    }
                                });
                            }
                        })
                        .catch(err => {
                            logMSG({
                                level: 'error',
                                message: func.onCatchCreateLogMSG(err),
                                sysOperation: 'check',
                                sysLevel: 'auth'
                            });
                            res.status(500).json({ error: err });
                        });
                }
            }).catch(err => {
                logMSG({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'check',
                    sysLevel: 'auth'
                });
                res.status(500).json({ error: err });
            });
    }
});

authRouter.get('/clientSiteID', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findById(req.userId)
            .exec()
            .then(results => {
                res.status(200).json({ sideID: results.siteID });
            }).catch(err => {
                res.status(500).json({ error: err });
            });
    }
});

authRouter.post('/checkForUser', [
    check('email').isString().isEmail(),
    check('password').isString().isLength({ min: 5 })
], (req, res) => {
    const userData = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findOne({ email: userData.email })
            .exec()
            .then(results => {
                if (results !== null) { res.status(200).json({ exist: true }); }
                else { res.status(200).json({ exist: false }); } // res.status(404).json({ message: 'No valid entry found for provided Email' }); }
            }).catch(err => {
                logMSG({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'check',
                    sysLevel: 'auth'
                });
                res.status(500).json({ error: err });
            });
    }
});

authRouter.post('/forgotpass', [
    check('email').isString().isEmail().normalizeEmail(),
    check('companyName').not().isEmpty().isString(),
    sanitizeBody('notifyOnReply').toBoolean()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const loginData = req.body;
        Auth.findOne({ email: loginData.email, company: loginData.companyName }) //, '-__v -firstname -lastname');
            .select('lastLogin siteID password levelAuth _id')
            .exec()
            .then(auth => {
                if (!auth) { res.status(404).send(variables.errorMsg.notfound); }
                else {
                    Site.findById(auth.siteID)
                        .exec()
                        .then(resultData => {
                            if (!resultData) { res.status(404).json({ message: 'No valid entry found for provided Email' }); }
                            else {
                                func.createToken(res, auth, resultData);
                            }
                        })
                        .catch(err => {
                            logMSG({
                                level: 'error',
                                message: func.onCatchCreateLogMSG(err),
                                sysOperation: 'check',
                                sysLevel: 'auth'
                            });
                            res.status(500).json({ error: err });
                        });
                }
            }).catch(err => {
                logMSG({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'check',
                    sysLevel: 'auth'
                });
                res.status(500).json({ error: err });
            });
    }
});

authRouter.post('/resetpass', func.resetPassCheck, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('newpass').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const loginData = req.body;
        Auth.findById(req.userId) //, '-__v -firstname -lastname');
            .exec()
            .then(auth => {
                if (!auth) { res.status(404).send(variables.errorMsg.notfound); }
                else {
                    loginData.newpass = bcrypt.hashSync(loginData.newpass, null);
                    auth.password = loginData.newpass;
                    Auth.findByIdAndUpdate(req.userId, auth)
                        .exec()
                        .then((qqq) => {
                            logMSG({
                                siteID: req.siteID,
                                customerID: req.userId,
                                type: "customer",
                                level: "information",
                                message: 'Password was successfully changed for user with ID ' + req.userId,
                                sysOperation: "update",
                                sysLevel: "auth customers"
                            });
                            res.status(200).send(variables.successMsg.update); // Changed
                        });
                }
            }).catch(err => {
                logMSG({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'check',
                    sysLevel: 'auth'
                });
                res.status(500).json({ error: err });
            });
    }
});

authRouter.get('/getAuth', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findById(req.userId)
            .exec()
            .then(rest => {
                if (rest) { res.status(200).send(rest); }
                else { res.status(200).send([]); }
                // else { res.status(404).send(variables.errorMsg.notfound); }
            })
            .catch(err => {
                logMSG({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'auth'
                });
                res.status(500).json({ error: err });
            });
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////

authRouter.post('/register',
    [
        check('email').isEmail().normalizeEmail(),
        check('password').isString().trim().isLength({ min: 5 }).escape(),
        check('siteName').not().isEmpty().isString().trim().escape(),
        sanitizeBody('notifyOnReply').toBoolean(),
    ], async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        else {
            const userData = req.body;
            const isAuthExist = await Customer.find({ email: userData.email });
            const isCustExist = await Customer.find({ email: userData.email });
            if (isAuthExist.length == 0 && isCustExist.length == 0) {
                // Get Site Type ID
                let siteType;
                if (!!userData.siteTypeID) { siteType = await SiteType.find({ name: userData.siteTypeID }); }// Look for the siteTypeID
                else { siteType = await SiteType.find({ name: '5b0428384953411bd455bb90' }); }// Type Store
                // Create Site
                let sitePublicKey = func.generatePublicKey();
                let newsite = { name: userData.siteName, publicKey: sitePublicKey, type: siteType._id }
                // Creating new Site
                let site = new Site(newsite);
                site.save().then(newSiteRes => {
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
                    auth.save()
                        .then(newUser => {
                            customer.save()
                                .then(newCustomer => {
                                    logMSG({
                                        siteID: newSiteRes._id,
                                        customerID: newCustomer._id,
                                        type: 'customer',
                                        siteName: newSiteRes.name,
                                        siteOwnerAuth: newUser._id,
                                        siteOwnerCust: newCustomer._id,
                                        level: 'information',
                                        message: 'New web API site was added successfully to DB',
                                        sysOperation: 'create',
                                        sysLevel: 'site'
                                    });
                                })
                                .catch(err => {
                                    logMSG({
                                        siteID: newSiteRes._id,
                                        type: 'customer',
                                        siteName: newSiteRes.name,
                                        level: 'fatal',
                                        message: func.onCatchCreateLogMSG(err),
                                        sysOperation: 'create',
                                        sysLevel: 'site'
                                    });
                                    res.status(500).json({ error: err });
                                });
                            func.createToken(res, newUser, site);
                        })
                        .catch(err => {
                            logMSG({
                                siteID: newSiteRes._id,
                                type: 'auth',
                                siteName: newSiteRes.name,
                                level: 'fatal',
                                message: func.onCatchCreateLogMSG(err),
                                sysOperation: 'create',
                                sysLevel: 'site'
                            });
                            res.status(500).json({ error: err });
                        });
                });
            } else {
                res.status(403).json({ message: 'Provided email address is already taken!' });
            }
        }
    });

authRouter.post('/editAuth', func.checkAuthenticated, async (req, res) => {
    const userData = req.body;
    check('email').isEmail();
    check('userId').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        // Check for existing Auth and User
        const isAuthExist = await Customer.find({ email: userData.email });
        const isCustExist = await Customer.find({ email: userData.email });

        if (isAuthExist.length > 0 || isCustExist.length > 0) {
            // Check if the new email exists
            if (!!userData.newEmail && userData.newEmail != '') {
                const isNewAuthExist = await Customer.find({ email: userData.newEmail });
                const isNewCustExist = await Customer.find({ email: userData.newEmail });

                if (isNewAuthExist.length > 0 || isNewCustExist.length > 0) {
                    return res.status(404).json({ message: 'Provided new email address is already taken!' });
                } else {
                    userData.email = userData.newEmail;
                }
            }

            Auth.findByIdAndUpdate(req.userId, userData)
                .exec()
                .then(() => {
                    Customer.findByIdAndUpdate(isCustExist[0]._id, userData)
                        .exec()
                        .then(() => {
                            logMSG({
                                siteID: req.siteID,
                                customerID: req.userId,
                                type: 'customer',
                                level: 'information',
                                message: variables.successMsg.update.message,
                                sysOperation: 'update',
                                sysLevel: 'auth'
                            });
                            res.status(200).json(variables.successMsg.update);
                        })
                        .catch(err => {
                            logMSG({
                                siteID: req.siteID,
                                customerID: req.userId,
                                type: 'customer',
                                siteName: newSiteRes.name,
                                level: 'error',
                                message: func.onCatchCreateLogMSG(err),
                                sysOperation: 'update',
                                sysLevel: 'auth'
                            });
                            res.status(500).json({ error: err });
                        });
                })
                .catch(err => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        type: 'auth',
                        level: 'error',
                        message: func.onCatchCreateLogMSG(err),
                        sysOperation: 'update',
                        sysLevel: 'auth'
                    });
                    res.status(500).json({ error: err });
                });
        } else {
            return res.status(404).json({ message: 'Provided old email doesn`t exist!.' })
        }
    }
});


/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

// TODO: Delete function if the user is SysAdmin for v2
// Removing the Auth will Delete all DB connected with the that customer
authRouter.delete('/deleteauthuserandsitedata', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty();
    check('siteID').not().isEmpty().isString();
    const errors = validationResult(req);
    let deleteLogs = true;
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const data = req.body;
        Auth.findById(req.userId)
            .exec()
            .then(rest => {
                if (rest !== null && req.userId !== rest._id) {
                    if (rest.levelAuth !== 'AD' && rest.levelAuth !== 'SA') {
                        return res.status(400).send(variables.errorMsg.unauthorized); // Changed
                    } else {
                        try {
                            let msg = { success: '', err: '' }
                            // Delete all Products - not
                            Products.remove({ siteID: req.siteID })
                                .then(() => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'product',
                                        level: 'information',
                                        message: 'All products were successfully deleted',
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                })
                                .catch(err => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'product',
                                        level: 'fatal',
                                        message: func.onCatchCreateLogMSG(err),
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    deleteLogs = false;
                                    res.status(500).json({ error: err });
                                });

                            // Delete all Customers - not
                            Customer.remove({ siteID: req.siteID })
                                .then(() => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'customer',
                                        level: 'information',
                                        message: 'All customers were successfully deleted',
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                })
                                .catch(err => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'product',
                                        level: 'fatal',
                                        message: func.onCatchCreateLogMSG(err),
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    deleteLogs = false;
                                    res.status(500).json({ error: err });
                                });

                            // Delete all Invoices - not
                            Invoices.remove({ siteID: req.siteID })
                                .then(() => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'invoices',
                                        level: 'information',
                                        message: 'Site Invoice details were successfully deleted',
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                })
                                .catch(err => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'invoices',
                                        level: 'fatal',
                                        message: func.onCatchCreateLogMSG(err),
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    deleteLogs = false;
                                    res.status(500).json({ error: err });
                                });

                            // Delete all Invoice Data - not
                            InvoiceCustomerData.remove({ siteID: req.siteID })
                                .then(() => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'invoices',
                                        level: 'information',
                                        message: 'All customer invoices were successfully deleted',
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                })
                                .catch(err => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'invoice',
                                        level: 'fatal',
                                        message: func.onCatchCreateLogMSG(err),
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    deleteLogs = false;
                                    res.status(500).json({ error: err });
                                });

                            // Delete Site Contacts Data - not
                            SiteContacts.remove({ siteID: req.siteID })
                                .then(() => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'contacts',
                                        level: 'information',
                                        message: 'Site Contacts details were successfully deleted',
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                })
                                .catch(err => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'contacts',
                                        level: 'fatal',
                                        message: func.onCatchCreateLogMSG(err),
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    deleteLogs = false;
                                    res.status(500).json({ error: err });
                                });

                            // Delete Site
                            Site.findByIdAndRemove(req.siteID)
                                .then(() => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'site',
                                        level: 'information',
                                        message: 'Site was successfully deleted',
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    msg.success = ``
                                })
                                .catch(err => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'site',
                                        level: 'fatal',
                                        message: func.onCatchCreateLogMSG(err),
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    deleteLogs = false;
                                    msg.err = ` Web Site with ID: ${req.siteID} and`;
                                });

                            // Delete Auth Acc - need to be tested
                            Auth.findOneAndRemove({ siteID: req.siteID })
                                .then(() => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'auth',
                                        level: 'information',
                                        message: 'Auth details were successfully deleted',
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    msg.success = `Database tables were successfully deleted! `;
                                    res.json(msg);
                                })
                                .catch(err => {
                                    logMSG({
                                        siteID: req.siteID,
                                        customerID: req.userId,
                                        type: 'auth',
                                        level: 'fatal',
                                        message: func.onCatchCreateLogMSG(err),
                                        sysOperation: 'delete',
                                        sysLevel: 'site'
                                    });
                                    deleteLogs = false;
                                    msg.err = `There was an error with deleting of the${msg.err} Auth account with ID: ${data.userId}! `;
                                    res.status(500).json({ error: msg.err });
                                });

                            // Delete SiteID Logs if everything is deleted successfully
                            if (deleteLogs) {
                                Logs.remove({ siteID: req.siteID })
                                    .then(() => {
                                        logMSG({
                                            siteID: req.siteID,
                                            customerID: req.userId,
                                            type: 'logs',
                                            level: 'information',
                                            message: `Web site logs data was successfully deleted`,
                                            sysOperation: 'delete',
                                            sysLevel: 'site'
                                        });
                                        msg.success = `Database tables were successfully deleted! `;
                                        res.status(200).json(msg);
                                    }).catch(err => {
                                        logMSG({
                                            siteID: req.siteID,
                                            customerID: req.userId,
                                            type: 'logs',
                                            level: 'fatal',
                                            message: func.onCatchCreateLogMSG(err),
                                            sysOperation: 'delete',
                                            sysLevel: 'site'
                                        });
                                    });
                            }

                        } catch (err) {
                            logMSG({
                                siteID: req.siteID,
                                customerID: req.userId,
                                level: 'fatal',
                                message: func.onCatchCreateLogMSG(err),
                                sysOperation: 'delete',
                                sysLevel: 'site'
                            });
                            return res.status(500).send(variables.errorMsg.remove);
                        }
                    }
                } else {
                    return res.status(404).json(variables.errorMsg.notfound);
                }
            }).catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'fatal',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'delete',
                    sysLevel: 'site'
                });
                res.status(500).json({ error: err });
            });
    }
});

module.exports = authRouter;