const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const SiteContacts = require('../models/SiteContacts');
const SiteLogs = require('../models/SiteLogs');
const Auth = require('../models/Auth');
const express = require('express');
const siteDataRouter = express.Router();
const func = require('../func');
const variables = require('../var');


function logMSG(data) {
    new SiteLogs(data).save();
}
/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
//Get Site Data by SiteID
siteDataRouter.post('/getsitecontacts', func.getSiteID, (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        SiteContacts.find({ siteID: req.siteID }, '-__v -siteID ').exec()
            .find(results => {
                if (!!!results || results.length == 0) { res.json(variables.errorMsg.notfound); }
                else { res.status(200).send(results); }
            }).catch(err => {
                // Add new Log
                logMSG({
                    siteID: req.siteID,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'sitecontacts'
                });
                res.status(500).json({ error: err });
            });
    }
});

siteDataRouter.get('/getAuthSiteContacts', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findById(req.userId).exec()
            .then(auth => {
                if (auth && auth.siteID) {
                    SiteContacts.find({ siteID: auth.siteID }, '-__v -siteID ').exec()
                        .then(results => {
                            (!!!results || results.length == 0) ? res.json(variables.errorMsg.notfound) : res.status(200).send(results[0]);
                        });
                } else {
                    res.status(404).json(variables.errorMsg.notfound);
                }
            }).catch(err => {
                // Add new Log
                logMSG({
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'authsitecontacts'
                });
                res.status(500).json({ error: err });
            });
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////

//TODO: Add additional fields check as required fields for v2
siteDataRouter.post('/addOrEditSiteContacts', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        SiteContacts.findOne({ siteID: req.siteID }).exec()
            .then(siteCont => {
                if (siteCont == null) {
                    siteConts.siteID = req.siteID;
                    const newData = new SiteContacts(siteConts);
                    newData.save().then(() => {
                        logMSG({
                            siteID: req.siteID,
                            level: 'information',
                            message: `Site Contacts were successfully created/updated for siteID '${req.siteID}'.`,
                            sysOperation: 'update',
                            sysLevel: 'sitecontacts'
                        });
                        res.status(200).send(variables.successMsg.created); // Changed
                    });
                } else {
                    SiteContacts.findByIdAndUpdate(siteCont._id, siteConts, (err, siteCont) => {
                        if (err)
                            return res.status(500).send(variables.errorMsg.serverError); // Changed
                        return res.status(200).json({ data: siteCont, message: 'Site Contacts data was successfully updated' });
                        //TODO: Do we need to send the result update data back to the user?;
                    });
                }
            }).catch(err => {
                // Add new Log
                logMSG({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'authsitecontacts'
                });
                res.status(500).json({ error: err });
            });
    }
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

siteDataRouter.post('/removeSiteContacts', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('levelAuth').not().isEmpty().isString().isLength({ min: 2, max: 3 }); // TODO: Test this or with authLevel
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        if (req.levelAuth != 'AD' && req.levelAuth != 'MN') {
            return res.status(401).json(variables.errorMsg.unauthorized);
        } else {
            SiteContacts.findOneAndRemove({ siteID: req.siteID })
                .then(() => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'information',
                        message: `Site Contacts were successfully deleted for siteID '${req.siteID}'.`,
                        sysOperation: 'deleted',
                        sysLevel: 'sitecontacts'
                    });
                    res.status(200).send(variables.successMsg.remove); // Changed
                }).catch(err => {
                    // Add new Log
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userId,
                        level: 'error',
                        message: func.onCatchCreateLogMSG(err),
                        sysOperation: 'get',
                        sysLevel: 'authsitecontacts'
                    });
                    res.status(500).json({ error: err });
                });
        }
    }
});

module.exports = siteDataRouter;