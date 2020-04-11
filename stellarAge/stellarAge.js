const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const express = require('express');
const stellarRouter = express.Router();
const func = require('../func');
const variables = require('../var');
const moment = require('moment');

///////////////////////////// Model
const mongoose = require("mongoose");

const stellarSchema = new mongoose.Schema({
    username: { type: String, default: '' },
    fleetsString: { type: String, default: '' },
    userMaxDuration: { type: Number, default: 0 },
    fleets: [{
        fleetType: { type: String, default: 'Light' },
        travelDuration: { type: Number, default: 0 },
        travelRemainingTime: { type: Number, default: 0 },
        remainingTime: { type: Number, default: 0 }
    }]
});

module.exports = mongoose.model("StellarModel", stellarSchema);
/////////////////////////////// Model END

stellarRouter.get('/', async(req, res) => {
    const by = {};
    StellarModel.find(by, "-__v")
        .exec()
        .then(data => {
            res.status(200).send(data);
        });
});

stellarRouter.post('/', async(req, res) => {
    let data = req.body;
    const isUserExist = await StellarModel.find({ username: data.username });
    if (isUserExist.length === 0) {
        let rallyData = new StellarModel(data);
        rallyData.save().then(() => {
            res.status(200).send(variables.successMsg.update);
        });
    } else {
        StellarModel.findOneAndUpdate({ username: data.username }, data)
            .then(() => {
                res.status(200).send(variables.successMsg.update);
            });
    }
});

stellarRouter.delete('/', async(req, res) => {
    let data = req.body;
    if (data && data.username) { // delete user
        const isUserExist = await StellarModel.find({ username: data.username });
        StellarModel.remove({ username: data.username })
            .then(() => {
                res.status(200).send(variables.successMsg.delete);
            });
    } else { // delete all
        StellarModel.remove({})
            .then(() => {
                res.status(200).send(variables.successMsg.delete);
            });
    }
});

module.exports = stellarRouter;