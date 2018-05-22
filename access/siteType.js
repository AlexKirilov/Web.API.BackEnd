var SiteType = require('../models/SiteType');
var variables = require('../var');
var express = require('express');
var siteTypeRouter = express.Router();
var func = require('../func');

siteTypeRouter.post('/createsitetype', (req, res) => {
    let typeData = req.body;
    typeData.name = typeData.name.toLowerCase();

    SiteType.findOne({ name: typeData.name }, (err, result) => {
        if (err) res.status(500).send(variables.errorMsg.type500.serverError);
        if (!!typeData && typeData.name.trim() != '' && (result === null)) {
            let newType = new SiteType(typeData);
            newType.save((err, resData) => {
                if (err)
                    return res.status(500).send(variables.errorMsg.type500.newUser)//TODO Change MSG
                res.json(variables.successMsg.created);
            });
        } else
            return res.json({ message: 'This type name already exists!' });
    });


});

siteTypeRouter.get('/getsitetypes', async (req, res) => {
    var types = await SiteType.find({}, '-__v');
    res.send(types)
});

siteTypeRouter.post('/checkForExistingWebType', async (req, res) => {
    var typeData = req.body;
    typeData.name = typeData.name.toLowerCase();
    if (typeData && typeData.name.trim() != '') {
        SiteType.findOne({ name: typeData.name }, (err, result) => {
            if (err) return res.status(500).send(variables.errorMsg.type500.serverError);
            return res.status(200).send({ exist: (result !== null) });
        });

    } else
        res.status(200).send({ exist: false });
});


//DELETE OR EDIT ONLY from DB

module.exports = siteTypeRouter;