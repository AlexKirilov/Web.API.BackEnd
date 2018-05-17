var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');
var express = require('express');
var router = express.Router();
var variables = require('./var');

var func = {
    validateEmail: (email) => {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },
    generateToken: () => {
        var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#£$%*()';
        var token = '';
        for(var i = 0; i < 6; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        return token;
    },
    createToken: (res, user, key) => {
        var payload = { sub: user.id, type: user.type }
        var token = jwt.encode(payload, key);
        res.status(200).send({ token })
    },
    //TODO: This need to be tested -> key ot change back to variables.masterKey
    checkAuthenticated: (req, res, next) => {
        console.log('In 2')
        if (!req.header('Authorization'))
            return res.status(401).send( variables.errorMsg.type401.unauthorized )
        var token = req.header('Authorization').split(' ')[1]; //[0] removing the 'token' string
        var payload = jwt.decode(token, variables.masterKey); // TODO: Change to key
        if (!payload)
            return res.status(401).send( variables.errorMsg.type401.unauthorized )

        req.userId = payload.sub;
        console.log('req.userId: ', req.userId)
        next();
    }, // .post('/login', checkAuthenticated, async (req, res) => {
}

module.exports = func;