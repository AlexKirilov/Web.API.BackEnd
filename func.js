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
    createToken: (res, user, site) => {
        let encrKey = variables.masterKey + site.publicKey + user.levelAuth;
        let payload = { sub: user.id, type: user.levelAuth };
       
        let SiteData = `${user.levelAuth} ${site.publicKey}`;
        let WebSite = `ID ${site._id}`     
        let token = jwt.encode(payload, encrKey);
        return res.status(200).send({ token, SiteData, WebSite });
    },
    checkAuthenticated: (req, res, next) => {
        if (!req.header('Authorization'))
            return res.status(401).send(variables.errorMsg.unauthorized);

        let token = req.header('Authorization').split(' ')[1]; // [0] removing the 'token' string
        let siteData = req.header('SiteData').split(' '); // [0] LevelOfAuth + [1] Public Key
        let siteID = req.header('WebSite').split(' ')[1]; // [0] removing the 'ID' string
        let levelOfAuth = siteData[0]; //SA, AD, MN, CU
        let publicKey = siteData[1];
        
        let decryptKey = variables.masterKey + publicKey + levelOfAuth;
        let payload = jwt.decode(token, decryptKey);
        if (!payload)
            return res.status(401).send(variables.errorMsg.unauthorized);

        req.userId = payload.sub;
        req.siteID = siteID;
        req.authLevel = levelOfAuth;
        next();
    },
    getSiteID: (req, res, next) => {
        if (!req.header('WebSite'))
            return res.status(401).send(variables.errorMsg.unauthorized);

        let siteID = req.header('WebSite').split(' ')[1]; // [0] removing the 'ID' string
        req.siteID = siteID;
        next();
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