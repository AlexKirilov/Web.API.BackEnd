
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const Customers = require('../models/Customers');
const SiteLogs = require('../models/SiteLogs');
const Comments = require('../models/Comments');
const express = require('express');
const variables = require('../var');
const func = require('../func');
const commentsRouter = express.Router();

function logMSG(data) {
    new SiteLogs(data).save();
}

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
// All comments by productID
// Required data {data.productID}
commentsRouter.post('/get', func.getSiteID, (req, res) => {
    sanitizeBody('notifyOnReply').toBoolean()
    const errors = validationResult(req);
    if (!errors.isEmpty() || !!!req.siteID || !!!data.productID) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Comments.find({ siteID: req.siteID, productID: req.body.productID })
            .exec()
            .then(results => { res.send(results); })
            .catch(err => {
                // Add new Log
                logMSG({
                    siteID: req.siteID,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'comments'
                });
                res.status(500).json({ error: err });
            });
    }

});

/////////////////////////////////////////////
////////////// PUT //////////////////////////
/////////////////////////////////////////////
// Required data {data.comment, data.productID}
commentsRouter.post('/create', func.checkAuthenticated, (req, res) => {
    check('siteID').not().isEmpty().isString();
    check('comment').not().isEmpty().isString();
    check('productID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        let data = req.body;
        data.siteID = req.siteID;
        if (!!!req.userId) {
            data.customersName = 'Guest';
            addComment(data, res);
        } else {
            Customers.findById(req.userId)
                .exec()
                .then(results => {
                    data.customersName = `${results.firstname} ${results.lastname}`;
                    data.customerID = req.userID;
                    addComment(data, res);
                })
                .catch(err => {
                    logMSG({
                        siteID: req.siteID,
                        customerID: req.userID,
                        level: 'error',
                        message: func.onCatchCreateLogMSG(err),
                        sysOperation: 'create',
                        sysLevel: 'comments'
                    });
                    res.status(500).json({ error: err });
                });
        }
    }
});

function addComment(data, res) {
    let newComment = new Comments(data);
    newComment.save()
        .then(results => { res.status(200).send(results); })
        .catch(err => {
            logMSG({
                siteID: req.siteID,
                customerID: req.userID,
                level: 'error',
                message: func.onCatchCreateLogMSG(err),
                sysOperation: 'create',
                sysLevel: 'comments'
            }).save();
            res.status(500).json({ error: err });
        });
}

/////////////////////////////////////////////
////////////// REMOVE ///////////////////////
/////////////////////////////////////////////
// Required data {data.productID}
commentsRouter.post('/remove', func.getSiteID, (req, res) => {
    check('siteID').not().isEmpty().isString();
    check('_id').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else if (!!!req.body._id) {
        res.status(500).json(variables.errorMsg.invalidData);
    } else {
        Comments.findByIdAndRemove(req.body._id)
            .then(() => { res.status(200).json(variables.successMsg.remove); })
            .catch(err => {
                logMSG({
                    siteID: req.siteID,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'delete',
                    sysLevel: 'comments'
                });
                res.status(500).json({ error: err });
            });
    }
});

module.exports = commentsRouter;