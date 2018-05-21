let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let Customer = require('../models/Customers');
let express = require('express');
let authRouter = express.Router();
let func = require('../func');
let variables = require('../var');

/* Level of Auth
// SA -> SysAdmin
// AD -> Admin
// MN -> Manager
// CU -> Customer
// GU -> Guest
 */

// Last Login
// Created Account
authRouter.post('/login', async (req, res) => {
    let loginData = req.body;
    if (loginData && loginData.password && loginData.email && loginData.password != void 0 && loginData.email != void 0 && func.validateEmail(loginData.email)) {
        let customer = await Customer.findOne({ email: loginData.email }, '-__v -levelAuth -firstname -lastname')
        if (customer == void 0)
            return res.status(401).send(variables.errorMsg.type401.invalidCreds)

        bcrypt.compare(loginData.password, customer.password, (err, isMatch) => {
            if (!isMatch) {
                return res.status(401).send(variables.errorMsg.type401.invalidCreds);
            }
            func.createToken(res, customer, variables.masterKey);
        });
    } else
        return res.status(401).send(variables.errorMsg.type401.invalidData);
});


authRouter.post('/register', async (req, res) => {
    let userData = req.body;
    if (userData && userData.password && userData.email && userData.username && userData.firstname && userData.lastname
        && userData.password != void 0 && userData.email != void 0 && func.validateEmail(userData.email)
    ) {
        let isAuthExist = await Customer.find({ email: data.email });
        let isCustExist = await Customer.find({ email: data.email });
        if (isAuthExist.length == 0 && isCustExist.length == 0) {
            let customer = new Customer(userData);
            customer.levelAuth = 'AD'; // Should not be visible for the users
            customer.type = 'Admin'; // Visible for the customers
            customer.token = func.generateToken();
            customer.save((err, newUser) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.type500.newUser)
                }
                func.createToken(res, newUser, variables.masterKey);
            });
        } else {
            return res.json({ message: 'Current Email address already exists!' });
        }
    }
});


authRouter.post('/checkForUser', async (req, res) => {
    let userData = req.body;
    if (userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        let customer = await Customer.findOne({ email: userData.email });
        if (customer !== null) {
            return res.status(204).send({ exist: true });
        }
        res.status(200).send({ exist: false });
    }
});

authRouter.post('/changeauthlevel', func.checkCustomerAuthenticated, async (req, res) => {

    let userData = req.body;
    
    Customer.findById(req.userId, (err, rest) => {
        if (err || rest.type !== 'AD' || rest.type !== 'SA') {
            return res.status(401).send(variables.errorMsg.type401.invalidCreds);
        } else {
            Customer.findById(userData.customerID, (err, result) => {
                if (err) {
                    return res.json({ message: 'Customer was not found' })
                } else {
                    res.status(200).send({ message: 'Customers access level was updated successfully' });
                }
            });
        }
    })
});

// Removing the Customer Delete all DB connected with the customer
authRouter.post('/deleteauthuser', func.checkCustomerAuthenticated, async (req, res) => {
    let data = req.body;
    Customer.findById(req.userId, (err, rest) => {
        if (err || rest.type !== 'AD' || rest.type !== 'SA') {
            return res.status(401).send(variables.errorMsg.type401.invalidCreds);
        } else {
            let userData = req.body;
            if (userData.authUserID !== void 0 && userData.authUserID.trim() !== '') { // Delete customer
                RemoveCustomer(data, userData.authUserID);
            } else {
                RemoveCustomer(data, req.userId);
            }
        }
    });
});


// Invoice Details
// Invoices
// Products
// Removing the Customer Delete all DB connected with the customer
function RemoveCustomer (data, id) {
    let method, path;
    try {
        let isCustExist = Customer.find({ _id: id });
        if (isCustExist.length == 1) {


            // Delete Customer Invoice Details
            let exist = InvoiceDetails.find({ customer: id });
            if (exist.length > 0) {
                InvoiceDetails.findByIdAndRemove(exist[0]._id, null, (err, result) => {
                    if (err) res.json(variables.errorMsg.type500.serverError);
                    console.log(result);
                });
            }

            // Delete Customer Products
            Products.remove({ customer: id }).exec();

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
};

module.exports = authRouter;