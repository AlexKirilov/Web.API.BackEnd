var SiteLogs = require('../models/SiteLogs');
var variables = require('../var');
var express = require('express');
var siteLogsRouter = express.Router();
var func = require('../func');


/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
siteLogsRouter.get('/getLogs', async (req, res) => {
    const data = req.body;
    let by = {};
    if (!!data.type) by.type = data.type;
    if (!!data.level) by.level = data.level;
    if (!!data.date) by.logDateTime = data.date;
    const logs = await SiteLogs.find(by, '-__v');
    res.send(logs)
});

siteLogsRouter.post('/getSiteLogs', func.getSiteID, async (req, res) => {
    const data = req.body;
    let by = {};
    if (!!!req.siteID)
        return res.status(400).send(variables.errorMsg.invalidData); // Changed

    by.siteID = req.siteID;
    if (!!data.type) { by.type = data.type; }
    if (!!data.level) { by.level = data.level; }
    if (!!data.date) {
        by.logDateTime = {
            "$gte": new Date (data.date),
            "$lt": new Date (new Date (data.date).setDate(new Date(data.date).getDate() + 1) - 1000), 
        }; 
    }
    console.log(by)
    SiteLogs.find( by , '-__v -siteID -_id', (err, results) => {
        if (err) {
            return res.status(500).send(variables.errorMsg.serverError);
        }
        return res.status(200).send(results);
    });
});

siteLogsRouter.get('/logDataFilter', (req, res) => {
    const data = {
        type: [
            {value: '', label: 'All'},
            {value: 'product', label: 'Product'},
            {value: 'invoice', label: 'Invoice'},
            {value: 'category', label: 'Category'},
        ],
        level: [
            {value: '', label: 'All'},
            {value: 'fatal', label: 'Fatal'},
            {value: 'error', label: 'Error'},
            {value: 'warning', label: 'Warning'},
            {value: 'information', label: 'Information'},
            {value: 'debug', label: 'Debug'},
        ]
    }
    res.send(data)
});

/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
// message, levelType, siteID, ?customerId
siteLogsRouter.post('/addLog', func.getSiteID, async (req, res) => {
    let data = req.body;
    if (!!!req.siteID || !!!data.message || !!!data.level)
        return res.status(400).send(variables.errorMsg.invalidData); // Changed

    data.siteID = req.siteID;
    data.logDateTime = func.currentDate();

    let logs = new SiteLogs(data);
    logs.save((err, result) => {
        if (err)
            return res.status(500).send(variables.errorMsg.update); // Changed
        return res.status(200).send(variables.successMsg.created);
    });
});

// TODO: REMOVE Logs which are older then 100 days
module.exports = siteLogsRouter;