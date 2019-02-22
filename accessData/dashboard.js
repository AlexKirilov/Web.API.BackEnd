
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const express = require('express');
const dashboardRouter = express.Router();
const func = require('../func');
const variables = require('../var');
const Orders = require("../models/store/Orders");
const Products = require("../models/store/Products");
const moment = require('moment');

dashboardRouter.post('/sales', func.getSiteID, async (req, res) => {
    check('siteID').not().isEmpty().isString();
    check('days').not().isEmpty().isNumeric();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const days = req.body.days
        const by = { siteID: req.siteID }; // , date: { "$gte": forDay, "$lt": opToDat } };
        const List = {}
        Orders.find(by).then(ordersList => {
            for (let d = days; d >= 0; d--) {
                seekingDay = moment(getYesterdayString(d)).format('DD-MM-YY');
                if (!List[seekingDay]) { List[seekingDay] = 0; }
                ordersList.forEach((order) => {
                    orderDate = moment(order.date).format('DD-MM-YY');
                    if (seekingDay === orderDate) {
                        List[seekingDay]++;
                    }
                });
            }
            res.status(200).send(List);
        });
    }
});

dashboardRouter.get('/orders', func.getSiteID, async (req, res) => {
    check('siteID').not().isEmpty().isString();
    check('days').not().isEmpty().isNumeric();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        days = req.body.days
        Orders.find({ siteID: req.siteID }).then(prod => {
            if (prod) {
                let tmp = {
                    canceled: 0,
                    forApproval: 0,
                    delevering: 0,
                    delivered: 0
                }
                prod.forEach(pro => {
                    // -1 Canceled // 0 For approval // 1 delevering // 2 delivered
                    switch (pro.flag) {
                        case -1: tmp.canceled++; break;
                        case 0: tmp.forApproval++; break;
                        case 1: tmp.delevering++; break;
                        case 2: tmp.delivered++; break;
                    }
                });
                let chartData = [['Task', 'Product Quantity List']];
                chartData.push(['Canceled', tmp.canceled]);
                chartData.push(['For approval', tmp.forApproval]);
                chartData.push(['On the way', tmp.delevering]);
                chartData.push(['Delivered', tmp.delivered]);

                return res.status(200).send(chartData);
            } else {
                return res.status(200).send([]);
            }
        });
    }
});

dashboardRouter.get('/products', func.getSiteID, async (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {

        chartData = [['Task', 'Product Quantity List']];
        Products.find({ siteID: req.siteID }, { name: 1, quantity: 1 }).exec().then(products => {
            if (products) {
                products.forEach(prod => {
                    chartData.push([prod.name, prod.quantity]);
                });
                res.status(200).send(chartData);
            } else res.status(200).send(0);
        })
    }
});

dashboardRouter.get('/saleslist', func.getSiteID, async (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        salesList = {};
        Orders.find({ siteID: req.siteID }).then(prod => {
            if (prod) {
                prod.forEach(pro => {
                    pro.order.forEach(list => {
                        if (salesList[list.name] == undefined || salesList[list.name] == null) {
                            salesList[list.name] = 0
                        } else {
                            salesList[list.name] = salesList[list.name] + 1;
                        }
                    });
                });
                return res.status(200).send(sortObject(salesList));
            } else {
                return res.status(200).send([]);
            }
        });
    }
});

dashboardRouter.get('/productsmin', func.getSiteID, async (req, res) => {
    check('siteID').not().isEmpty().isString();
    sanitizeBody('notifyOnReply').toBoolean()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        chartData = [['Task', 'Never selled products']];
        Products.find({ siteID: req.siteID }, { name: 1, quantity: 1 }).exec().then(products => {
            if (products) {
                products.forEach(prod => {
                    chartData.push([prod.name, prod.quantity]);
                });
                res.status(200).send(chartData);
            } else res.status(200).send(0);
        })
    }
});

function sortObject(obj) {
    var arr = [];
    var prop;
    for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            arr.push({
                'key': prop,
                'value': obj[prop]
            });
        }
    }
    arr.sort(function (a, b) {
        return b.value - a.value;
    });
    return arr; // returns array
}

// most common element in array
// tmp = [ {'pear': 5}, {'apple': 4} , 'orange', {'apple': 5}, {'pear': 5}, {'apple': 4} , 'orange', {'apple': 5}]
// console.log('Array', modeArray(tmp))

function modeArray(array) {
    if (array.length == 0)
        return null;
    var modeMap = {},
        maxCount = 1,
        modes = [];

    for (var i = 0; i < array.length; i++) {
        var el = array[i];

        if (modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;

        if (modeMap[el] > maxCount) {
            modes = [el];
            maxCount = modeMap[el];
        }
        else if (modeMap[el] == maxCount) {
            modes.push(el);
            maxCount = modeMap[el];
        }
    }
    return modes;
}

function getYesterdayString(days) {
    var date = new Date();
    date.setDate(date.getDate() - days);
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2); // fix 0 index
    return (date.getYear() + 1900) + '-' + month + '-' + day;
}

module.exports = dashboardRouter;