const express = require("express");
const wsRouter = express.Router();
const wsSchema = require('../models/DataToolsWS');

wsRouter.get("/WS", (req, res) => {
    wsSchema.find({status: 'processing'})
      .exec()
      .then(data => {
        res.status(200).send(data);
      });
});

wsRouter.get("/WSAll", (req, res) => {
    wsSchema.find()
      .exec()
      .then(data => {
        res.status(200).send(data);
      });
});

wsRouter.post('/WS', (req, res) => {
    const newWS = req.body;
    console.log(newWS);
    let ws = new wsSchema(newWS);
    ws.save().then( rest => {
        console.log('New WS: ', rest);
        res.json(rest);
    })
});

wsRouter.put('/WS', (req, res) => {
    const updateWS = req.body;
    // let ws = new wsSchema(updateWS);
    wsSchema.findOneAndUpdate({ guid: updateWS.guid }, updateWS).exec().then( response => res.status(200).json(response))
});

module.exports = wsRouter;
