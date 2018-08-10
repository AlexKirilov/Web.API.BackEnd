const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const SiteLogs = require('../models/SiteLogs');
const Categories = require('../models/Category');
const SiteType = require('../models/SiteType');
const express = require('express');
const categoryRouter = express.Router();
const func = require('../func');
const variables = require('../var');
//READY // DB need to be think of the Personal Site Categories ?????
//ADD Delete category ?

function logMSG(data) {
    new SiteLogs(data).save();
}
/*
    const { check, validationResult } = require('express-validator/check');
    const { sanitizeBody } = require('express-validator/filter');
    const SiteLogs = require('../models/SiteLogs');

    check('email').isString().isEmail().normalizeEmail();
    check('password').isString().trim().isLength({ min: 5 }).escape();
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {

    .catch(err => {
                // Add new Log
                new SiteLogs({
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'check',
                    sysLevel: 'auth'
                }).save();
                res.status(500).json({ error: err });
            })
   */


/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
// All Categories without SubCategories
categoryRouter.get('/categories', func.getSiteID, (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Categories.find({ siteID: req.siteID, "parentId": null }).exec()
            .then(data => { res.status(200).send(data); })
    }
});

// All Sub Categories by parent category ID
// Required data {"type":"5b0428384953411bd455bb90"}
categoryRouter.post('/subcategories', func.getSiteID, (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Categories.find({ siteID: req.siteID, "parentId": req.type }).exec()
            .then(data => {
                res.status(200).send(data);
            });
    }
});

// All sub categories
// categoryRouter.post('/allsubcategories', async (req, res) => {
//     let data = await Categories.find({});
//     res.send(data);
// });


/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////
// Required data { "name": "bmw", "type":"5b0428384953411bd455bb90", "parentId":"5b05149b8d9e8024cc528527"}
categoryRouter.post('/createcategory', func.getSiteID, async (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let data = req.body;
        let tmpType = await SiteType.findOne({ name: 'store' }, '-__v'); // Temporary check till version 2 of the app
        data.name = data.name.toLowerCase();
        // Add default category if missing
        if (!!!req.siteID)
            return res.status(500).json(variables.errorMsg.invalidData);
        if (!!!data.type) data.type = tmpType.id; // Temporary check till version 2 of the app
        if (!!!data.name || data.name.trim() == '' || !!!data.type) {
            return res.status(400).json({ message: 'There are missing data. Please fill all data and try again!' });
        }

        let by = { siteID: req.siteID, name: data.name };
        data.siteID = req.siteID;
        // Check if category name already exists
        let ifCatExist = Categories.find(by, (err, results) => {
            if (err) return res.status(500).send(variables.errorMsg.serverError);  // Changed
            if (results.length == 0) {
                let newCategory = new Categories(data);
                newCategory.save((err, result) => {
                    if (err)
                        return res.status(500).send(variables.errorMsg.serverError);
                    // Save Log
                    logMSG({
                        siteID: data.siteID,
                        message: `Category '${data.name}' was created!`,
                        type: 'category',
                        level: 'information',
                        sysOperation: 'check',
                        sysLevel: 'webtype'
                    });
                    return res.status(200).send(variables.successMsg.created); //TODO: change message
                });
            } else {
                res.json({ message: 'This category name is already taken!' }); //TODO: change message
            }
        });
    }
});

// Required data { "name": "clothes"}
categoryRouter.post('/checkForExistingCategory', func.getSiteID, (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let data = req.body;
        if (data && data.name.trim() != '') {
            Categories.findOne({ siteID: req.siteID, name: data.name }).exec()
                .then(type => {
                    res.status(200).json({ exist: type !== null && type.length > 0 });
                });
        }
    }
});

// Required data { "_id": "3123"}
// TODO: Create POSTMAN call and add to datastore file
categoryRouter.post('/remove', func.getSiteID, (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        if (!!req.body && !!req.body._id) {
            Categories.remove({ siteID: req.siteID, name: req.body.name }).then(() => {
                logMSG({
                    siteID: data.siteID,
                    message: `Category '${data.name}' was deleted successfully!`,
                    type: 'category',
                    level: 'information',
                    sysOperation: 'delete',
                    sysLevel: 'category'
                })
            });
        }
    }
});

module.exports = categoryRouter;