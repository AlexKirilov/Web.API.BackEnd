const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var SiteLogs = require('../models/SiteLogs');
var variables = require('../var');
var express = require('express');
var siteLogsRouter = express.Router();
var func = require('../func');
var util = require('util');
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

function convertSort(sortColumn) {
    if (typeof sortColumn !== 'object') {
        let sort = {};
        sortColumn.split(',').forEach(element => {
            let tmpEl = element.toString().toLowerCase();
            if (tmpEl.indexOf('desc') !== -1) {
                (sortColumn.indexOf('desc') !== -1) ?
                sortColumn = sortColumn.split('desc') :
                sortColumn = sortColumn.split('Desc');
                sortColumn.pop();
                sort[sortColumn.toString()] = 'desc';
            } else {
                sort[sortColumn] = 'asc';
            }
            sortColumn = sort;
            console.log(sortColumn)
        });
    }
    return sortColumn;
}

/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
siteLogsRouter.get('/getLogs', async (req, res) => {
    sanitizeBody('notifyOnReply').toBoolean()
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const data = req.body;
        const query = req.query;

        const perPage = parseInt(query.perPage) || 20;
        const page = parseInt(query.page) || 1;
        const sort = convertSort(query.sort || {});
        const skip = (page == 1) ? 0 : (page - 1) * perPage;
        let by = {};
        if (!!data.type) by.type = data.type;
        if (!!data.level) by.level = data.level;
        if (!!data.date) by.logDateTime = data.date;

        SiteLogs.find(by, '-__v')
            .sort(sort)
            .skip(skip)
            .limit(perPage)
            .exec()
            .then(results => {
                SiteLogs.count({}).then(count => {
                    let responce = {
                        rows: count,
                        pages: Math.ceil(count / perPage),
                        page: page,
                        perPage: perPage,
                        displayedRows: results.length,
                        firstrowOnPage: (page <= 1) ? 1 : (page - 1) * perPage + 1,
                        lastRowOnPage: ( (page * perPage - 1) > count) ? count : (page * perPage - 1),
                        sortBy: sort,
                        results: results
                    }
                    res.status(200).send(responce);
                });
            })
            .catch(err => { res.status(500).json({ error: err }); });
    }
});

// siteLogsRouter.post('/getSiteLogs', func.getSiteID, async (req, res) => {
//     const data = req.body;
//     let by = {};
//     if (!!!req.siteID)
//         return res.status(400).send(variables.errorMsg.invalidData); // Changed

//     by.siteID = req.siteID;
//     if (!!data.type) { by.type = data.type; }
//     if (!!data.level) { by.level = data.level; }
//     if (!!data.date) {
//         by.logDateTime = {
//             "$gte": new Date (data.date),
//             "$lt": new Date (new Date (data.date).setDate(new Date(data.date).getDate() + 1) - 1000), 
//         }; 
//     }
//     console.log(by)
//     SiteLogs.find( by , '-__v -siteID -_id', (err, results) => {
//         if (err) {
//             return res.status(500).send(variables.errorMsg.serverError);
//         }
//         return res.status(200).send(results);
//     });
// });

siteLogsRouter.get('/logDataFilter', (req, res) => {
    const data = {
        type: [
            { value: '', label: 'All' },
            { value: 'product', label: 'Product' },
            { value: 'invoice', label: 'Invoice' },
            { value: 'category', label: 'Category' },
        ],
        level: [
            { value: '', label: 'All' },
            { value: 'fatal', label: 'Fatal' },
            { value: 'error', label: 'Error' },
            { value: 'warning', label: 'Warning' },
            { value: 'information', label: 'Information' },
            { value: 'debug', label: 'Debug' },
        ]
    }
    res.send(data)
});

// /////////////////////////////////////////////////
// ///////////////////    GET    ///////////////////
// /////////////////////////////////////////////////
// message, levelType, siteID, ?customerId
// siteLogsRouter.post('/addLog', func.getSiteID, async (req, res) => {
//     let data = req.body;
//     if (!!!req.siteID || !!!data.message || !!!data.level)
//         return res.status(400).send(variables.errorMsg.invalidData); // Changed

//     data.siteID = req.siteID;
//     data.logDateTime = func.currentDate();

//     let logs = new SiteLogs(data);
//     logs.save((err, result) => {
//         if (err)
//             return res.status(500).send(variables.errorMsg.update); // Changed
//         return res.status(200).send(variables.successMsg.created);
//     });
// });

// siteLogsRouter.post('/systemLogs', func.getSiteID, async (req, res) => {
//     let data = req.body;
//     if (!!!req.siteID || !!!data.message || !!!data.level)
//         return res.status(400).send(variables.errorMsg.invalidData); // Changed

//     data.siteID = req.siteID;
//     data.logDateTime = func.currentDate();

//     let logs = new SiteLogs(data);
//     logs.save((err, result) => {
//         if (err)
//             return res.status(500).send(variables.errorMsg.update); // Changed
//         return res.status(200).send(variables.successMsg.created);
//     });
// });

// TODO: REMOVE Logs which are older then 100 days

module.exports = siteLogsRouter;