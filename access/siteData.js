let jwt = require('jwt-simple');
let bcrypt = require('bcrypt-nodejs');
let SiteContacts = require('../models/SiteContacts');
let Auth = require('../models/Auth');
let express = require('express');
let siteDataRouter = express.Router();
let func = require('../func');
let variables = require('../var');
//READY


/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
//Get Site Data by SiteID
siteDataRouter.post('/getsitecontacts', func.getSiteID, (req, res) => {
    if (!!!req.siteID)
        return res.status(400).send(variables.errorMsg.invalidData); // Changed

    SiteContacts.find({ siteID: req.siteID }, '-__v -siteID ', (err, results) => {
        if (err)
            return res.status(500).send(variables.errorMsg.serverError);
        if (!!!results || results.length == 0)
            return res.json(variables.errorMsg.notfound);

        return res.status(200).send(results);
    })
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////

//TODO: Add additional fields check as required fields for v2
siteDataRouter.post('/addOrEditSiteContacts', func.checkAuthenticated, (req, res) => {
    let siteConts = req.body
    if (!!!siteConts || !!!req.siteID || !!!req.userId)
        return res.status(400).send(variables.errorMsg.invalidData); // Changed

    SiteContacts.findOne({ siteID: req.siteID }, (err, siteCont) => {
        if (err)
            return res.status(500).send(variables.errorMsg.serverError); // Changed
        if (siteCont == null) {
            siteConts.siteID = req.siteID;
            let newData = new SiteContacts(siteConts);
            newData.save((err, result) => {
                if (err) {
                    return res.status(500).send(variables.errorMsg.serverError); // Changed
                }
                res.status(200).send(variables.successMsg.created); // Changed
            })
        } else {
            SiteContacts.findByIdAndUpdate(siteCont._id, siteConts, (err, siteCont) => {
                if (err)
                    return res.status(500).send(variables.errorMsg.serverError); // Changed
                return res.status(200).json({ data: siteCont, message: 'Site Contacts data was successfully updated' });
                //TODO: Do we need to send the result update data back to the user?;
            });
        }
    });
});

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

siteDataRouter.post('/removeSiteContacts', func.checkAuthenticated, (req, res) => {
    let siteConts = req.body
    if (!!!siteConts || !!!req.siteID || !!!req.userId || !!!req.levelAuth)
        return res.status(400).send(variables.errorMsg.invalidData); // Changed

    if (req.levelAuth != 'AD' && req.levelAuth != 'MN')
        return res.status(401).json({ message: 'Unauthorized' });

    SiteContacts.findOneAndRemove({ siteID: req.siteID }, (err, result) => {
        if (err)
            return res.status(500).send(variables.errorMsg.serverError); // Changed
        res.status(200).send(variables.successMsg.remove); // Changed
    });
});

module.exports = siteDataRouter;