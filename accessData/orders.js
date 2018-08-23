const { check, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const Products = require("../models/store/Products");
const Orders = require("../models/store/Orders");
const SiteLogs = require("../models/SiteLogs");
const express = require("express");
const orderRouter = express.Router();
const func = require("../func");
const variables = require("../var");

function logMSG(data) {
  new SiteLogs(data).save();
}

orderRouter.get("/getorders", func.checkAuthenticated, (req, res) => {
  check("userId")
    .not()
    .isEmpty()
    .isString();
  check("siteID")
    .not()
    .isEmpty()
    .isString();
  check("name")
    .trim()
    .not()
    .isEmpty()
    .isString();
  check("authLevel")
    .not()
    .isEmpty()
    .isString()
    .isLength({ min: 2, max: 3 });
  sanitizeBody("notifyOnReply").toBoolean();

  let by;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    // const productData = req.body;
    // const query = req.query;
    // const perPage = parseInt(query.perPage || productData.perPage) || 25;
    // const page = parseInt(query.page || productData.page) || 1;
    // const sort = convertSort(query.sort || productData.sortBy || {});
    // const skip = page == 1 ? 0 : (page - 1) * perPage;
    by = { siteID: req.siteID };

    // if (!!productData.name)
    //   by.name = { $regex: productData.name, $options: "i" };
    // if (!!productData.price) by.price = productData.price; // TODO: Search between min and max price
    // if (!!productData.quantity) by.quantity = productData.quantity;
    // if (!!productData.categoryID) by.categoryID = productData.categoryID;
    // if (!!req.userId) {
    //   const customer = await Customers.findById(req.userId);
    //   customerDiscount = customer.personalDiscount;
    // }
    Orders.find(by)
      //   .sort(sort)
      //   .skip(skip)
      //   .limit(perPage)
      .exec()
      .then(orders => {
        // Orders.count(by).then(count => {
        //   let responce = {
        //     rows: count,
        //     pages: Math.ceil(count / perPage),
        //     page: page,
        //     perPage: perPage,
        //     displayedRows: results.length,
        //     firstrowOnPage: page <= 1 ? 1 : (page - 1) * perPage + 1,
        //     lastRowOnPage:
        //       page * perPage - 1 > count ? count : page * perPage - 1,
        //     sortBy: sort,
        //     results: orders
        //   };
        res.status(200).send(orders);
        // });
      })
      .catch(err => {
        logMSG({
          siteID: req.siteID,
          // customerID: req.userId,
          level: "error",
          message: func.onCatchCreateLogMSG(err),
          sysOperation: "get",
          sysLevel: "order"
        });
        res.status(500).json({ error: err });
      });
  }
});

function UpdateProductQnt(siteID, productID, qnt) {
  Products.findOne({ siteID: siteID, _id: productID })
    .exec()
    .then(res => {
      res.quantity = parseInt(res.quantity) - parseInt(qnt);
      Products.findByIdAndUpdate(productID, res).then(r => {});
    })
    .catch(err => {
      logMSG({
        siteID: siteID,
        level: "error",
        message: func.onCatchCreateLogMSG(err),
        sysOperation: "update",
        sysLevel: "product"
      });
    });
}

orderRouter.post("/addOrder", func.checkAuthenticated, async (req, res) => {
  check("userId")
    .not()
    .isEmpty()
    .isString();
  check("siteID")
    .not()
    .isEmpty()
    .isString();
  check("name")
    .trim()
    .not()
    .isEmpty()
    .isString();
  check("authLevel")
    .not()
    .isEmpty()
    .isString()
    .isLength({ min: 2, max: 3 });
  sanitizeBody("notifyOnReply").toBoolean();

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    by = { siteID: req.siteID, customerID: req.userId };
    order = req.body;
    let OrderUp = {
      siteID: req.siteID,
      customerID: req.userId,
      order
    };
    let bool = false;
    await Orders.findOneAndUpdate(by, OrderUp)
      .exec()
      .then(newORder => {
        // Update Products Quantity
        const c = newORder.order.length;
        console.log('newORder', c)
        for (let i = 0; i < c; i++) {
            console.log(order[i].prodClientQnt , order[i].prodClientQnt , newORder.order[i].prodClientQnt)
            order[i].prodClientQnt = order[i].prodClientQnt - newORder.order[i].prodClientQnt;
        }

        order.forEach(element => {
            console.log(element.prodClientQnt);
            UpdateProductQnt(req.siteID, element._id, element.prodClientQnt);
          });
        if (newORder) {
          //   Orders.findByIdAndUpdate(by, order).then(() => {

          res.status(200).send(variables.successMsg.update);
          //   });
        } else {
          new Orders(OrderUp).save().then(() => {
            order.forEach(element => {
              UpdateProductQnt(req.siteID, element._id, element.prodClientQnt);
            });
            res.status(200).send(variables.successMsg.created);
          });
        }
      })
      .catch(err => {
        logMSG({
          siteID: req.siteID,
          // customerID: req.userId,
          level: "error",
          message: func.onCatchCreateLogMSG(err),
          sysOperation: "create",
          sysLevel: "order"
        });
        res.status(500).json({ error: err });
      });
  }
});

orderRouter.delete("/removeOrder", func.checkAuthenticated, (req, res) => {
  check("userId")
    .not()
    .isEmpty()
    .isString();
  check("OrderID")
    .not()
    .isEmpty()
    .isString();
  check("siteID")
    .not()
    .isEmpty()
    .isString();
  check("name")
    .trim()
    .not()
    .isEmpty()
    .isString();
  check("authLevel")
    .not()
    .isEmpty()
    .isString()
    .isLength({ min: 2, max: 3 });
  sanitizeBody("notifyOnReply").toBoolean();

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    Orders.findByIdAndRemove(OrderID)
      .then(deleted => {
        //  Update Products Quantity on reject
        res.status(200).send(variables.successMsg.deleted);
      })
      .catch(err => {
        logMSG({
          siteID: req.siteID,
          // customerID: req.userId,
          level: "error",
          message: func.onCatchCreateLogMSG(err),
          sysOperation: "delete",
          sysLevel: "order"
        });
        res.status(500).json({ error: err });
      });
  }
});

module.exports = orderRouter;
