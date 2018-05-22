let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let SiteContacts = require('../models/SiteContacts');
let Auth = require('../models/Auth');
let express = require('express');
let siteContactsRouter = express.Router();
let func = require('../func');
let variables = require('../var');


//TODO: Remove the authentication check
siteContactsRouter.post('/getsitecontacts', func.checkAuthenticated, (req, res) => {
    let siteConts = req.body
    if (!!!siteConts || !!!req.siteID)
        return res.status(500).send(variables.errorMsg.type500.serverError);
    SiteContacts.find({ siteID: req.siteID }, (err, results) => {
        if (err)
            return res.status(500).send(variables.errorMsg.type500.serverError);
        if (!!!results || results.length == 0)
            return res.status(204).send(variables.errorMsg.type500.notfound);

        res.status(200).send(results);
    })
});

//TODO: Add additional fields check as required fields
siteContactsRouter.post('/createAndEditSiteContacts', func.checkAuthenticated, (req, res) => {
    let siteConts = req.body
    if (!!!siteConts || !!!req.siteID || !!!req.userID)
        return res.status(500).send(variables.errorMsg.type500.serverError);

    let newData = new SiteContacts(siteConts);
    newData.save((err, result) => {
        if (err) {
            return res.status(500).send(variables.errorMsg.type500.serverError);
        }
        res.status(200).send(variables.successMsg.created); //TODO: change message
    })
});

siteContactsRouter.post('/removeSiteContacts', func.checkAuthenticated, (req, res) => {
    let siteConts = req.body
    if (!!!siteConts || !!!req.siteID || !!!req.userID)
        return res.status(500).send(variables.errorMsg.type500.serverError);

    Auth.findById(req.userId, (err, rest) => {
        if (err || rest.type !== 'AD' || rest.type !== 'SA') {
            return res.status(401).send(variables.errorMsg.type401.invalidCreds);
        } else {

            SiteContacts.findOneAndRemove({ siteID: req.siteID }, (err, result) => {
                if (err)
                    return res.status(500).send(variables.errorMsg.type500.serverError);
                res.status(200).send(variables.successMsg.remove);
            });
        }
    });
});

module.exports = siteContactsRouter;