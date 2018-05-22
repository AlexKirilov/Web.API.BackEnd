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
    generatePublicKey: () => {
        let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#£$%*()';
        let key = '';
        for (let i = 0; i < 6; i++) {
            key += chars[Math.floor(Math.random() * chars.length)];
        }
        return key;
    },
    createToken: (res, user, site) => { //TODO Add Site ID, Public Key and LevelOfAuth
        let encrKey = variables.masterKey + site.publicKey + user.levelAuth; // TODO TEST if needs to change LevelOfAuth
        let payload = { sub: user.id, type: user.levelAuth };
       
        let SiteData = `${site._id} ${user.levelAuth} ${site.publicKey}`;        
        let token = jwt.encode(payload, encrKey);
        res.status(200).send({ token, SiteData });
    },
    checkAuthenticated: (req, res, next) => {
        if (!req.header('Authorization'))
            return res.status(401).send(variables.errorMsg.type401.unauthorized);

        let token = req.header('Authorization').split(' ')[1]; // [0] removing the 'token' string
        let siteData = req.header('SiteData').split(' '); // [0] SiteID + [1] LevelOfAuth + [2] Public Key
        let siteID = siteData[0];
        let levelOfAuth = siteData[1]; //SA, AD, MN, CU
        let publicKey = siteData[2];

        let decryptKey = variables.masterKey + publicKey + levelOfAuth;
        let payload = jwt.decode(token, decryptKey);
        if (!payload)
            return res.status(401).send(variables.errorMsg.type401.unauthorized);

        req.userId = payload.sub;
        req.siteID = siteID;
        next();
    }, // .post('/login', checkAuthenticated, async (req, res) => {
    request: (req, method, path, callback) => {
        let port = 3000;
        if (req.protocol == 'http') port = 3000; // should goes to 80
        if (req.protocol == 'https') port = 443;
        let options = {
            hostname: req.hostname,
            port, // http 80 https 443
            path,method, headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.authorization, 'SiteData': req.headers.SiteData },
        };

        console.error('Authorizationnnnnnnnnnnnnnnnn ', req.headers.authorization);
        console.error('SiteDataaaaaaaaaaaaaaaaaaaaaa ', req.headers.SiteData);
        http.request(options, function (res) {
            // console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
                console.log('*****************************************************');
            });
        }).end(callback());
    },
    currentDate() {
        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1; //January is 0!
        let yyyy = today.getFullYear();

        if (dd < 10) dd = '0' + dd
        if (mm < 10) mm = '0' + mm
        return mm + '/' + dd + '/' + yyyy;
    }
}

module.exports = func;