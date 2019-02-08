const SiteLogs = require('./access/siteLogs').default;
const jwt = require('jwt-simple');
const bcrypt = require('bcrypt-nodejs');
const express = require('express');
const router = express.Router();
const variables = require('./var');
const http = require('http');

const func = {
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
        let username = (user.lastname == '') ? user.firstname : user.lastname;
        return res.status(200).send({ token, SiteData, WebSite, username });
    },
    auto: (req, res) => {
        if (!req.header('Authorization'))
            return false;
        let token = req.header('Authorization').split(' ')[1]; // [0] removing the 'token' string
        let siteData = req.header('SiteData').split(' '); // [0] LevelOfAuth + [1] Public Key
        let siteID = req.header('WebSite').split(' ')[1]; // [0] removing the 'ID' string
        let levelOfAuth = siteData[0]; //SA, AD, MN, CU
        let publicKey = siteData[1];

        let decryptKey = variables.masterKey + publicKey + levelOfAuth;
        let payload = jwt.decode(token, decryptKey);
        if (!payload)
            return false;
        return payload.sub;

    },
    checkAuthenticated: (req, res, next) => {
        if (!req.header('Authorization'))
            return res.status(401).send(variables.errorMsg.unauthorized);
        try {
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
        } catch ( err ){
            return res.status(401).send(variables.errorMsg.unauthorized);
        }
    },
    getSiteID: (req, res, next) => {
        if (!req.header('WebSite'))
            return res.status(401).send(variables.errorMsg.unauthorized);

        const userId = func.auto(req,res);
        let siteID = req.header('WebSite').split(' ')[1]; // [0] removing the 'ID' string
        req.siteID = siteID;
        req.userId = userId;
        next();
    },
    currentDate() {
        // let today = new Date();
        // let dd = today.getDate();
        // let mm = today.getMonth() + 1; //January is 0!
        // let yyyy = today.getFullYear();

        // if (dd < 10) dd = '0' + dd
        // if (mm < 10) mm = '0' + mm
        // return mm + '/' + dd + '/' + yyyy;
        return new Date();
    },
    addLog(
        siteID,
        customerID,
        logType,
        level,
        message,
        siteName,
        siteOwnerAuth,
        siteOwnerCust,
        sysOperation,
        sysLevel,
    ) {
        const newLog = {
            siteID,
            customerID,
            logType: (logType) ? logType : '-',
            level: (level) ? level : '-',
            message: (message) ? message : '-',
            siteName: (siteName) ? siteName : '-',
            siteOwnerAuth: (siteOwnerAuth) ? siteOwnerAuth : '-',
            siteOwnerCust: (siteOwnerCust) ? siteOwnerCust : '-',
            sysOperation: (sysOperation) ? sysOperation : '-',
            sysLevel: (sysLevel) ? sysLevel : '-',
            logDateTime: new Date(),
        }
        return newLog;
    },
    onCatchCreateLogMSG(err) {
        let msg = '';
        if (err.errors && err.errors.msg && err.errors.param) {
            if (err.errors.length > 1) {
                msg += `${err.errors.msg} - ${err.errors.param}`;
            }
            else { msg = `${err.errors.msg} - ${err.errors.param}`; }
        } else if (err && err.message) {
            msg = err.message;
        }
        return msg || '';
    },
    convertSort: (sortColumn) => {
        console.log('innnnnnn')
        if (typeof sortColumn !== 'object') {
            let sort = {};
            sortColumn.split(',').forEach(element => {
                let tmpEl = element.toString().toLowerCase();
                if (tmpEl.indexOf('desc') !== -1) {
                    tmpEl = tmpEl.split('desc');
                    tmpEl.pop();
                    sort[tmpEl.toString()] = -1;
                } else {
                    sort[tmpEl] = 1;
                }
                sortColumn = sort;
            });
        }
        return sortColumn;
    }
}

module.exports = func;