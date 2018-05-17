var WebType = require('../models/WebType');
var express = require('express');
var webTypeRouter = express.Router();
var func = require('../func');
var variables = require('../var');


webTypeRouter.post('/createwebtype', (req, res) => {
    var typeData = req.body;
    if (!typeData.name || typeData.name.trim() == '') {
        return res.status(401).send(variables.errorMsg.type401.invalidData);
    }
    let webtype = new WebType(typeData);
    webtype.save((err, newType) => {
        if (err) {
            return res.status(500).send(variables.errorMsg.type500.serverError);
        }
        res.status(200).send(variables.successMsg.webtype);
    });
});

webTypeRouter.get('/types', async (req, res) => {
    var types = await WebType.find({});
    res.send(types)
});

webTypeRouter.post('/checkForExistingWebType', async (req, res) => {
    var typeData = req.body;
    if (typeData && typeData.name.trim() != '') {
        var type = await WebType.findOne({ name: typeData.name })
        if (type !== null) {
            return res.status(200).send({ exist: true })
        }
        res.status(200).send({ exist: false });
    }
});
//TODO CheckForExistingTypeName

module.exports = webTypeRouter;