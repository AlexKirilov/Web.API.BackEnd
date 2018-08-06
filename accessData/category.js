let Categories = require('../models/Category');
let SiteType = require('../models/SiteType');
let SiteLogs = require('../models/SiteLogs');
let express = require('express');
let categoryRouter = express.Router();
let func = require('../func');
let variables = require('../var');
//READY // DB need to be think of the Personal Site Categories ?????
//ADD Delete category ?

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
// All Categories without SubCategories
categoryRouter.get('/categories', func.getSiteID, async (req, res) => {
    let data = await Categories.find({ siteID: req.siteID, "parentId": null });
    res.send(data);
});

// All Sub Categories by parent category ID
// Required data {"type":"5b0428384953411bd455bb90"}
categoryRouter.post('/subcategories', func.getSiteID, async (req, res) => {
    let data = await Categories.find({ siteID: req.siteID, "parentId": req.type });
    res.send(data);
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
                let tmpLog = {
                    message: `Category '${data.name}' was created!`,
                    type: 'category',
                    logDateTime: func.currentDate(),
                    siteID: data.siteID,
                    level: 'information'
                }
                const log = new SiteLogs(tmpLog);
                log.save();
                return res.status(200).send(variables.successMsg.created); //TODO: change message
            });
        } else {
            res.json({ message: 'This category name is already taken!' }); //TODO: change message
        }
    });
});

// Required data { "name": "clothes"}
categoryRouter.post('/checkForExistingCategory', func.getSiteID, async (req, res) => {
    let data = req.body;
    if (data && data.name.trim() != '') {
        let type = await Categories.findOne({ siteID: req.siteID, name: data.name })
        if (type !== null)
            return res.json({ exist: true })
        res.json({ exist: false });
    }
});

// Required data { "_id": "3123"}
// TODO: Create POSTMAN call and add to datastore file
categoryRouter.post('/remove', func.getSiteID, (req, res) => {
    let data = req.body;
    if (!!data && !!data._id) {
        Categories.remove({ siteID: req.siteID, name: data.name }, err => res.json('Category was deleted') )
    }
});

module.exports = categoryRouter;