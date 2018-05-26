let Products = require('../models/store/Products');
let Customers = require('../models/Customers');
let Comments = require('../models/Comments');
let Site = require('../models/Site');
let express = require('express');
let variables = require('../var');
let func = require('../func');
let commentsRouter = express.Router();

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
// All comments by productID
// Required data {data.productID}
commentsRouter.post('/get', func.getSiteID, (req, res) => {
    let data = req.body;
    if(!!!req.siteID || !!!data.productID)
        return res.status(500).json(variables.errorMsg.invalidData);
    Comments.find({ siteID: req.siteID, productID: data.productID }, (err, results) => {
        return (err) ? res.status(500).json(variables.errorMsg.invalidData) : res.send(results);
    });
    
});

/////////////////////////////////////////////
////////////// PUT //////////////////////////
/////////////////////////////////////////////
// Required data {data.comment, data.productID}
commentsRouter.post('/create', func.checkAuthenticated, (req, res) => {
    let data = req.body;

    if (!!!req.siteID || !!!data.productID || !!!data.comment) {
        return res.status(500).json(variables.errorMsg.invalidData);
    }

    data.siteID = req.siteID;
    if(!!!req.userId) {
        data.customersName = 'Guest';
        addComment(data, res);
    } else {
        Customers.findById(req.userId, (err, results) => {
            data.customersName = `${results.firstname} ${results.lastname}`;
            data.customerID = req.userID;
            addComment(data, res);
        });   
    }
});

function addComment (data, res) {
    let newComment = new Comments (data);
    newComment.save((err, results) => {
        if(err) return res.status(500).json(variables.errorMsg.serverError);
        else return res.status(200).send(results);
    });
}

/////////////////////////////////////////////
////////////// REMOVE ///////////////////////
/////////////////////////////////////////////
// Required data {data.productID}
commentsRouter.post('/remove', func.getSiteID, (req, res) => {
    let dataComment = req.body;
    if (!!!req.siteID || !!!dataComment._id)
        return res.status(500).json(variables.errorMsg.invalidData);
    Comments.findByIdAndRemove(dataComment._id, (err, result) => {
        if (err) return res.status(500).json(variables.errorMsg.invalidData);
        else return res.status(200).json(variables.successMsg.remove);
    });  
});

module.exports = commentsRouter;