var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/User');
var express = require('express');
var authRouter = express.Router();
var func = require('../func');
var variables = require('../var');
/* Level of Auth
// SA -> System Admin
// AD -> Admin
// MN -> Manager
// CU -> Customer
// GU -> Guest
 */

//TODO Personal token in action

//Reg with Auth -> System Admin -> Only for API use
authRouter.post('/register', (req, res) => {
    var userData = req.body;
    if (userData && userData.password && userData.email && userData.username && userData.firstname && userData.lastname
        && userData.password != void 0 && userData.email != void 0 && func.validateEmail(userData.email)
    ) {
        var user = new User(userData);
        user.levelAuth = 'SA' // Should not be visible for the users
        user.type = 'SysAdmin' // Visible for the customers
        user.token = func.generateToken();
        user.save((err, newUser) => {
            if (err) {
                return res.status(500).send(variables.errorMsg.type500.newUser)
            }
            func.createToken(res, newUser, variables.masterKey);
        });
    }
});

authRouter.post('/login', async (req, res) => {
    var loginData = req.body;
    if (loginData && loginData.password && loginData.email && loginData.password != void 0 && loginData.email != void 0 && func.validateEmail(loginData.email)) {
        var user = await User.findOne({ email: loginData.email }, '-__v -levelAuth -firstname -lastname')
        if (user == void 0)
            return res.status(401).send(variables.errorMsg.type401.invalidCreds)

        bcrypt.compare(loginData.password, user.password, (err, isMatch) => {
            if (!isMatch) {
                return res.status(401).send(variables.errorMsg.type401.invalidCreds)
            }
            func.createToken(res, user, variables.masterKey);
        });
    } else
        return res.status(401).send(variables.errorMsg.type401.invalidData);
});

authRouter.post('/checkForUser', async (req, res) => {
    var userData = req.body;
    if (userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        var user = await User.findOne({ email: userData.email })
        if (user !== null) {
            return res.status(204).send({ exist: true })
        }
        res.status(200).send({ exist: false });
    }
});


module.exports = authRouter;