var SiteType = require('../models/SiteType');
var variables = require('../var');
var express = require('express');
var siteTypeRouter = express.Router();
var func = require('../func');


/////////////////////////////////////////////////
///////////////////    GET    ///////////////////
/////////////////////////////////////////////////
siteTypeRouter.get('/getsitetypes', async (req, res) => {
    var types = await SiteType.find({}, '-__v');
    res.send(types)
});

//Requires { name : 'name' }
siteTypeRouter.post('/checkForExistingWebType', async (req, res) => {
    var typeData = req.body;
    typeData.name = typeData.name.toLowerCase();
    if (typeData && typeData.name.trim() != '') {
        SiteType.findOne({ name: typeData.name }, (err, result) => {
            if (err) return res.status(500).send(variables.errorMsg.serverError);
            return res.status(200).send({ exist: (result !== null) });
        });
    } else
        res.status(200).send({ exist: false });
});

/////////////////////////////////////////////////
////////////// POST (NEW / UPDATE) //////////////
/////////////////////////////////////////////////
// Required fields { name } and to be SYS Admin
siteTypeRouter.post('/createsitetype', func.checkAuthenticated, (req, res) => {
    let typeData = req.body;
    if (!!!typeData.name)
        return res.status(400).send(variables.errorMsg.invalidData); // Changed

    typeData.name = typeData.name.toLowerCase();

    SiteType.findOne({ name: typeData.name }, (err, result) => {
        if (err) return res.status(500).send(variables.errorMsg.serverError);
        if (!!typeData && typeData.name.trim() != '' && (result === null)) {
            let newType = new SiteType(typeData);
            newType.save((err, resData) => {
                if (err)
                    return res.status(500).send(variables.errorMsg.created); // Changed
                return res.json(variables.successMsg.created);
            });
        } else
            return res.json({ message: 'This Type name already exists!' });
    });
});

//DELETE OR EDIT ONLY from DB

module.exports = siteTypeRouter;