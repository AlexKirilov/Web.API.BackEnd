
let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let User = require('../models/User');
let express = require('express');
let loginRouter = express.Router();
let func = require('./func');
let variables = require('./var');

/* Level of Auth
// SA -> System Admin
// AD -> Admin
// MN -> Manager
// CU -> Customer
// GU -> Guest
 */

loginRouter.post('/login', async (req, res) => {
    let loginData = req.body;
    if (loginData && loginData.password && loginData.email && loginData.password != void 0 && loginData.email != void 0 && func.validateEmail(loginData.email)) {
        var user = await User.findOne({ email: loginData.email }, '-__v -levelAuth -firstname -lastname');
        if (user == void 0)
            return res.status(401).send(variables.errorMsg.type401.invalidCreds);

        //System Admin check
        if (user.type === 'SA' && user.levelAuth === 'System Admin') {
            bcrypt.compare(loginData.password, user.password, (err, isMatch) => {
                if (!isMatch) {
                    return res.status(401).send(variables.errorMsg.type401.invalidCreds);
                }
                func.createToken(res, user, variables.masterKey);
            });
        } else if (user.type === 'AD' && user.levelAuth === 'Admin') {
            bcrypt.compare(loginData.password, user.password, (err, isMatch) => {
                if (!isMatch) {
                    return res.status(401).send(variables.errorMsg.type401.invalidCreds);
                }
                func.createToken(res, user, variables.masterKey);
            });
        } else if (user.type === 'MN' && user.levelAuth === 'Manager' && user.type === 'CU' && user.levelAuth === 'Cutomer') {
            bcrypt.compare(loginData.password, user.password, (err, isMatch) => {
                if (!isMatch) {
                    return res.status(401).send(variables.errorMsg.type401.invalidCreds);
                }
                func.createToken(res, user, variables.masterKey);
            });
        } else {
            return res.status(204).send(variables.errorMsg.type401.invalidCreds);// TODO change message
        }
    } else
        return res.status(401).send(variables.errorMsg.type401.invalidData);
});

loginRouter.post('/checkForUser', async (req, res) => {
    var userData = req.body;
    if (userData && userData.email.trim() != '' && func.validateEmail(userData.email)) {
        var user = await User.findOne({ email: userData.email })
        if (user !== null) {
            return res.status(204).send({ exist: true })
        }
        res.status(200).send({ exist: false });
    }
});

module.exports = loginRouter;