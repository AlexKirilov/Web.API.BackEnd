var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');
var User = require('./models/User');
var express = require('express');
var router = express.Router()

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function createToken (res, user) {
    var payload = { sub: user.id }
    var token = jwt.encode(payload, '123');
    res.status(200).send({ token })
}
router.post('/register', (req, res) => {
    var userData = req.body;
    if (userData && userData.password && userData.email && userData.username && userData.firstname && userData.lastname
        && userData.password != void 0 && userData.email != void 0 && validateEmail(userData.email)
    ) {
        var user = new User(userData);
        user.save((err, newUser) => {
            if (err) {
                return res.status(500).send({ message: 'Error creating new user' })
            }
            createToken(res, newUser);
        });
    }
});

router.post('/login', async (req, res) => {
    var loginData = req.body;

    if (loginData && loginData.password && loginData.email && loginData.password != void 0 && loginData.email != void 0 && validateEmail(loginData.email)) {
        var user = await User.findOne({ email: loginData.email })
        if (user == void 0)
            return res.status(401).send({ message: 'Email or Password invalid' })

        bcrypt.compare(loginData.password, user.password, (err, isMatch) => {
            if (!isMatch) {
                return res.status(401).send({ message: 'Email or Password invalid' })
            }
            createToken(res, user);
        });
    } else
        return res.status(401).send({ message: 'Invalid data' });
});

router.post('/checkForUser', async (req, res) => {
    var userData = req.body;
    if (userData && userData.email.trim() != '' && validateEmail(userData.email)) {
        var user = await User.findOne({ email: userData.email })
        if (user !== null) {
            return res.status(200).send({ exist: true })
        }
        res.status(200).send({ exist: false });
    }
});

var auth = {
    router,
    checkAuthenticated: (req, res, next) => {
        if (!req.header('Authorization'))
            return res.status(401).send({ message: 'Unauthorized. Missing Auth Hader' })
        var token = req.header('Authorization').split(' ')[1];
        var payload = jwt.decode(token, '123');
        if (!payload)
            return res.status(401).send({ message: 'Unauthorized. Missing Auth Hader' })
    
        req.userId = payload.sub;
        next();
    } // .post('/login', checkAuthenticated, async (req, res) => {
}
module.exports = auth;