let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let SiteContacts = require('../models/SiteContacts');
let Auth = require('../models/Auth');
let express = require('express');
let siteDataRouter = express.Router();
let func = require('../func');
let variables = require('../var');
//READY


siteDataRouter.post('/getsitecontacts', func.getSiteID, (req, res) => {
    let siteConts = req.body
    if (!!!siteConts || !!!req.siteID)
        return res.status(500).send(variables.errorMsg.type500.serverError);
    SiteContacts.find({ siteID: req.siteID }, '-__v -siteID ', (err, results) => {
        if (err)
            return res.status(500).send(variables.errorMsg.type500.serverError);
        if (!!!results || results.length == 0)
            return res.json(variables.errorMsg.type500.notfound);

        res.status(200).send(results);
    })
});

//TODO: Add additional fields check as required fields for v2
siteDataRouter.post('/addOrEditSiteContacts', func.checkAuthenticated, (req, res) => {
    let siteConts = req.body
    if (!!!siteConts || !!!req.siteID || !!!req.userId)
        return res.status(500).send(variables.errorMsg.type500.serverError);

    SiteContacts.findOne({ siteID: req.siteID }, (err, siteCont) => {
        if (err)
            return res.status(500).send(variables.errorMsg.type500.serverError);
        if (siteCont == null) {
            siteConts.siteID = req.siteID;
            let newData = new SiteContacts(siteConts);
            newData.save((err, result) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.type500.serverError);
                }
                res.status(200).send(variables.successMsg.created); //TODO: change message
            })
        } else {
            SiteContacts.findByIdAndUpdate(siteCont._id, siteConts, (err, siteCont) => {
                if (err)
                    return res.status(500).send(variables.errorMsg.type500.serverError);
                return res.status(200).json({ data: siteCont, message: 'Site Contacts data was successfully updated' });
                //TODO: Do we need to send the result update data back to the user;
            });
        }
    });
});

siteDataRouter.post('/removeSiteContacts', func.checkAuthenticated, (req, res) => {
    let siteConts = req.body
    if (!!!siteConts || !!!req.siteID || !!!req.userId || !!!req.levelAuth)
        return res.status(500).send(variables.errorMsg.type500.serverError);

    if (req.levelAuth != 'AD' && req.levelAuth != 'MN')
        return res.status(401).json({ message: 'Unauthorized' });

    SiteContacts.findOneAndRemove({ siteID: req.siteID }, (err, result) => {
        if (err)
            return res.status(500).send(variables.errorMsg.type500.serverError);
        res.status(200).send(variables.successMsg.remove);
    });
});

module.exports = siteDataRouter;