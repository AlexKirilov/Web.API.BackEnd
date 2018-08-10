const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const SiteLogs = require('../models/SiteLogs');
const SiteType = require('../models/SiteType');
const variables = require('../var');
const express = require('express');
const siteTypeRouter = express.Router();
const func = require('../func');

function logMSG(data) {
    new SiteLogs(data).save();
}

/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
siteTypeRouter.get('/getsitetypes', (req, res) => {
    SiteType.find({}, '-__v').exec()
        .then(types => { res.status(200).send(types); });
});

//Requires { name : 'name' }
siteTypeRouter.post('/checkForExistingWebType', async (req, res) => {
    check('name').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let typeData = req.body;
        typeData.name = typeData.name.toLowerCase();
        if (typeData && typeData.name.trim() != '') {
            SiteType.findOne({ name: typeData.name }).exec()
                .then(result => {
                    res.status(200).send({ exist: (result && result.length > 0) });
                }).catch(err => {
                    // Add new Log
                    logMSG({
                        level: 'error',
                        message: func.onCatchCreateLogMSG(err),
                        sysOperation: 'check',
                        sysLevel: 'webtype'
                    });
                    res.status(500).json({ error: err });
                });
        } else
            res.status(200).send({ exist: false });
    }
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
// Required fields { name } and to be SYS Admin
siteTypeRouter.post('/createsitetype', func.checkAuthenticated, (req, res) => {
    check('name').trim().not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let typeData = req.body;
        typeData.name = typeData.name.toLowerCase();

        SiteType.findOne({ name: typeData.name }).exec()
            .then(result => {
                if (result === null) {
                    new SiteType(typeData).save()
                        .then(() => {
                            logMSG({
                                level: 'information',
                                message: `New site type with name '${typeData.name}' was created successfully`,
                                sysOperation: 'create',
                                sysLevel: 'sitetype'
                            });
                            res.json(variables.successMsg.created);
                        })
                } else
                    return res.json({ message: 'This Type name already exists!' });
            }).catch(err => {
                res.status(500).json({ error: err });
            });
    }
});

//DELETE OR EDIT ONLY from DB

module.exports = siteTypeRouter;