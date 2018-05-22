let Categories = require('../models/Category');
let express = require('express');
let categoryRouter = express.Router();
let func = require('../func');
let variables = require('../var');

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
categoryRouter.get('/categories', async (req, res) => {
    let data = await Categories.find({});
    res.send(data)
});


/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////
//TODO: Type of category
categoryRouter.post('/createcategory', (req, res) => {
    let data = req.body;
    if (req.userId == void 0 && (data.name == void 0 || data.name.trim() == '')) {
        return res.status(400).send(variables.errorMsg.type401.invalidData);
    }

    let newCategory = new Categories(data);
    newCategory.save((err, result) => {
        if (err) {
            return res.status(500).send(variables.errorMsg.type500.serverError);
        }
        res.status(200).send(variables.successMsg.created); //TODO: change message
    });
});
//TODO: DELETE OR Convert
categoryRouter.post('/checkForExistingWebType', async (req, res) => {
    let data = req.body;
    if (data && data.name.trim() != '') {
        let type = await Categories.findOne({ name: data.name })
        if (type !== null) {
            return res.status(204).send({ exist: true })
        }
        res.status(200).send({ exist: false });
    }
});

module.exports = categoryRouter;