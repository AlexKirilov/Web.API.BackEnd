const { check, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const Products = require("../models/store/Products");
const Orders = require("../models/store/Orders");
const SiteLogs = require("../models/SiteLogs");
const Customers = require("../models/Customers");

const express = require("express");
const orderRouter = express.Router();
const func = require("../func");
const variables = require("../var");

function logMSG(data) {
  new SiteLogs(data).save();
}

function convertSort(sortColumn) {
  if (typeof sortColumn !== "object") {
    let sort = {};
    sortColumn.split(",").forEach(element => {
      let tmpEl = element.toString().toLowerCase();
      if (tmpEl.indexOf("desc") !== -1) {
        sortColumn.indexOf("desc") !== -1
          ? (sortColumn = sortColumn.split("desc"))
          : (sortColumn = sortColumn.split("Desc"));
        sortColumn.pop();
        sort[sortColumn.toString()] = "desc";
      } else {
        sort[sortColumn] = "asc";
      }
      sortColumn = sort;
    });
  }
  return sortColumn;
}

orderRouter.get("/getorders", func.checkAuthenticated, async (req, res) => {
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
    const productData = req.body;
    const query = req.query;

    const perPage = parseInt(query.perPage || productData.perPage) || 25;
    const page = parseInt(query.page || productData.page) || 1;
    const sort = convertSort(query.sort || productData.sortBy || {date: 'desc'});
    const skip = page == 1 ? 0 : (page - 1) * perPage;
    let flags = query.flags || productData.flags || null;

    by = { siteID: req.siteID };

    if (!!productData.name)
      by.name = { $regex: productData.name, $options: "i" };
    if (!!productData.price) by.price = productData.price; // TODO: Search between min and max price
    if (!!productData.quantity) by.quantity = productData.quantity;
    if (!!productData.categoryID) by.categoryID = productData.categoryID;
    if (!!req.userId) {
      const customer = await Customers.findById(req.userId);
      customerDiscount = (customer && customer.personalDiscount) ? customer.personalDiscount : 0;
    }
    // Convert to standart flag
    if (flags) {
      flags = flags.split("");
      let tmp = [];
      flags.forEach( flag => {
        if (flag == 'A') tmp.push('-1')
        else if (flag == 'B') tmp.push('0')
        else if (flag == 'C') tmp.push('1')
        else if (flag == 'D') tmp.push('2')
        else if (flag == 'E') tmp.push('3')
      });
      flags = tmp;
    }

    Orders.find(by)
      .sort(sort)
      .skip(skip)
      .limit(perPage)
      .exec()
      .then(orders => {
        if (orders) {
          // var ids = [];
          // orders.filter(order => ids.push(order.customerID));
          // var obj_ids = ids.map(function(id) { return ObjectId(id); });
          // const dddd = db.Customers.find({_id: {$in: obj_ids}});
          // console.log('Customers n Orders', dddd)
          if (flags) {
            orders = orders.filter( order => {
              return flags.indexOf(order.flag.toString()) === -1
            })
          }
          Orders.countDocuments(by).then(count => {
            let responce = {
              rows: count,
              pages: Math.ceil(count / perPage),
              page: page,
              perPage: perPage,
              displayedRows: orders.length,
              firstrowOnPage: page <= 1 ? 1 : (page - 1) * perPage + 1,
              lastRowOnPage:
                page * perPage - 1 > count ? count : page * perPage - 1,
              sortBy: sort,
              results: orders
            };

            res.status(200).send(responce);
          });
        }
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

orderRouter.get(
  "/getordersforapproval",
  func.checkAuthenticated,
  async (req, res) => {
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
    } else if (req.authLevel == "AD" || req.authLevel == "MN") {
      const productData = req.body;
      const query = req.query;
      const perPage = parseInt(query.perPage || productData.perPage) || 25;
      const page = parseInt(query.page || productData.page) || 1;
      const sort = convertSort(query.sort || productData.sortBy || {date: 'desc'});
      const skip = page == 1 ? 0 : (page - 1) * perPage;
      by = { siteID: req.siteID, flag: 0 };

      if (!!productData.name)
        by.name = { $regex: productData.name, $options: "i" };
      if (!!productData.price) by.price = productData.price; // TODO: Search between min and max price
      if (!!productData.quantity) by.quantity = productData.quantity;
      if (!!productData.categoryID) by.categoryID = productData.categoryID;
      if (!!req.userId) {
        const customer = await Customers.findById(req.userId);
        customerDiscount = (customer && customer.personalDiscount) ? customer.personalDiscount : 0;
      }
      Orders.find(by)
        .sort(sort)
        .skip(skip)
        .limit(perPage)
        .exec()
        .then(async orders => {
          var results = [];
          orders.forEach(order => {
            Customers.findById(order.customerID).then(cucu => {
              if (cucu)
              results.push({
                customerID: cucu._id,
                company: cucu.company,
                name: cucu.firstname + " " + cucu.lastname,
                date: order.date,
                flag: order.flag,
                order: order.order,
                siteID: order.siteID,
                id: order._id
              });
            });
          });
          Orders.countDocuments(by).then(count => {
            let responce = {
              rows: count,
              pages: Math.ceil(count / perPage),
              page: page,
              perPage: perPage,
              displayedRows: results.length,
              firstrowOnPage: page <= 1 ? 1 : (page - 1) * perPage + 1,
              lastRowOnPage:
                page * perPage - 1 > count ? count : page * perPage - 1,
              sortBy: sort,
              results
            };
            res.status(200).send(responce);
          });
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
  }
);

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
    // console.log(by, order);
    var aaa = await Orders.find({
      siteID: req.siteID,
      customerID: req.userId,
      date: {
        $gte: new Date(),
        $lt: new Date(new Date().setDate(new Date().getDate() + 1) - 1000)
      }
    });
    new Orders(OrderUp).save();
    Orders.findOneAndUpdate(by, OrderUp)
      .exec()
      .then(newORder => {
        // Update Products Quantity
        if (newORder == null) {
          // new Orders(order).save().then(result => {
          //   console.log('dddd')
          //   return res.status(200).send({ message: 'Order was added!' })
          // });
        } else {
          const c = newORder.length;
          // console.log('newORder', c)
          for (let i = 0; i < c; i++) {
            // console.log(order[i].prodClientQnt , order[i].prodClientQnt , newORder.order[i].prodClientQnt)
            order[i].prodClientQnt =
              order[i].prodClientQnt - newORder.order[i].prodClientQnt;
          }

          order.forEach(element => {
            // console.log(element.prodClientQnt);
            UpdateProductQnt(req.siteID, element._id, element.prodClientQnt);
          });
          if (newORder) {
            //   Orders.findByIdAndUpdate(by, order).then(() => {

            res.status(200).send(variables.successMsg.update);
            //   });
          } else {
            // new Orders(OrderUp).save().then(() => {
            //   order.forEach(element => {
            //     UpdateProductQnt(req.siteID, element._id, element.prodClientQnt);
            //   });
            //   res.status(200).send(variables.successMsg.created);
            // });
          }
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

orderRouter.post("/editOrder", func.checkAuthenticated, async (req, res) => {
  check("siteID")
    .not()
    .isEmpty()
    .isString();
  check("orderId")
    .trim()
    .not()
    .isEmpty()
    .isString();
  check("flag")
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
    if (
      req.authLevel == "AD" ||
      req.authLevel == "MN" ||
      req.authLevel == "EE"
    ) {

      Orders.findById(req.body.orderId).then(order => {
        order.flag = req.body.flag
        Orders.findByIdAndUpdate(req.body.orderId, order).then( (stat) => {
          res.status(200).send({message: 'dsada'}) })
      });
    }
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
