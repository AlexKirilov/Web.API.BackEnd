let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let express = require('express');
let router = express.Router();
let variables = require('./var');
let http = require('http');

let func = {
    validateEmail: (email) => {
        let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },
    generateToken: () => {
        let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#£$%*()';
        let token = '';
        for (let i = 0; i < 6; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        return token;
    },
    createToken: (res, user, key) => {
        if(!key) key = variables.masterKey;
        let payload = { sub: user.id, type: user.type }
        let token = jwt.encode(payload, key);
        res.status(200).send({ token })
    },
    //TODO: This need to be tested -> key ot change back to variables.masterKey
    checkAuthenticated: (req, res, next) => {
        if (!req.header('Authorization'))
            return res.status(401).send(variables.errorMsg.type401.unauthorized)
        let token = req.header('Authorization').split(' ')[1]; //[0] removing the 'token' string
        let payload = jwt.decode(token, variables.masterKey); // TODO: Change to key
        if (!payload)
            return res.status(401).send(variables.errorMsg.type401.unauthorized)

        req.userId = payload.sub;
        next();
    }, // .post('/login', checkAuthenticated, async (req, res) => {
    request: (req,method,path,callback) => {
        let port = 3000
        if (req.protocol == 'http') port = 3000; // should goes to 80
        if (req.protocol == 'https') port = 443;
        let options = {
            hostname: req.hostname,
            port, // http 80 https 443
            path,
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.authorization },
        };

        console.error('Authorizationnnnnnnnnnnnnnnnn ', req.headers.authorization)
        http.request(options, function (res) {
            // console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
                console.log('*****************************************************');
            });
        }).end(callback());
    }
}

module.exports = func;