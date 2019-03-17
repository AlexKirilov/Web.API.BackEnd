const { check, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const Products = require("../models/store/Products");
const Customers = require("../models/Customers");
const SiteLogs = require("../models/SiteLogs");
const Site = require("../models/Site");
const express = require("express");
const productRouter = express.Router();
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
  } else {
  }
  return sortColumn;
}

/////////////////////////////////////////////
////////////// GET //////////////////////////
/////////////////////////////////////////////
//categoryID
productRouter.post("/products", func.getSiteID, async (req, res) => {
  check("siteID")
    .not()
    .isEmpty()
    .isString();
  sanitizeBody("notifyOnReply").toBoolean();

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    let customerDiscount = 0;
    let by = {};
    const productData = req.body;
    const query = req.query;
    const perPage = parseInt(query.perPage || productData.perPage) || 25;
    const page = parseInt(query.page || productData.page) || 1;
    const sort = convertSort(query.sort || productData.sortBy || {});
    const skip = page == 1 ? 0 : (page - 1) * perPage;
    by = { siteID: req.siteID };

    if (!!productData.name)
      by.name = { $regex: productData.name, $options: "i" };
    if (!!productData.price) by.price = productData.price; // TODO: Search between min and max price
    if (!!productData.quantity) by.quantity = productData.quantity;
    if (!!productData.categoryID) by.categoryID = productData.categoryID;
    if (!!req.userId) {
      const customer = await Customers.findById(req.userId);
      customerDiscount = (customer) ? customer.personalDiscount : 0;
    }
    Products.find(by)
      .sort(sort)
      .skip(skip)
      .limit(perPage)
      .exec()
      .then(results => {
        results.forEach(item => item.discount = customerDiscount);
        Products.countDocuments(by).then(count => {
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
            results: results
          };
          res.status(200).send(responce);
        });
      })
      .catch(err => {
        logMSG({
          siteID: req.siteID,
          level: "error",
          message: func.onCatchCreateLogMSG(err),
          sysOperation: "create",
          sysLevel: "products"
        });
        res.status(500).json({ error: err });
      });
  }
});

productRouter.get("/geteditlevel", func.getSiteID, (req, res) => {
  check("siteID")
    .not()
    .isEmpty()
    .isString();
  sanitizeBody("notifyOnReply").toBoolean();

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    Site.findById(req.siteID)
      .exec()
      .then(results => {
        if (results) {
          res.status(200).json(results.editProd);
        } else {
          res.status(200).send(false);
        }
      })
      .catch(err => {
        res.status(500).json({ error: err });
      });
  }
});

/////////////////////////////////////////////
////////////// POST /////////////////////////
/////////////////////////////////////////////
// Required data { name : 'name' }
productRouter.post(
  "/createproduct",
  func.checkAuthenticated,
  async (req, res) => {
    // Only if it`s Admin or Manager
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
      // Check Edit level
      const editLevel = await Site.findById(req.siteID);
      if (req.authLevel == editLevel.editProd) {
        let productData = req.body;
        if (!!productData.sort) {
          productData.sort = productData.sort.filter(function(n) {
            return n != undefined && n.trim() != "";
          });
        }
        if (!!productData._id) {
          Products.findByIdAndUpdate(productData._id, productData).then(
            result => {
              logMSG({
                siteID: req.siteID,
                customerID: req.userId,
                level: "information",
                type: "product",
                message: `Product '${result.name}' was updated successfully!`,
                sysOperation: "update",
                sysLevel: "products"
              });
              res.status(200);
            }
          );
        } else {
          if (productData.categoryID == "") productData.categoryID = null;
          productData.siteID = req.siteID;
          if (!!!req.quantity) productData.quantity = 0;
          new Products(productData)
            .save()
            .then(() => {
              logMSG({
                siteID: req.siteID,
                customerID: req.userId,
                level: "information",
                type: "product",
                message: `Product '${
                  productData.name
                }' was added successfully!`,
                sysOperation: "create",
                sysLevel: "products"
              });
              res.status(200).send(variables.successMsg.created);
            })
            .catch(err => {
              logMSG({
                siteID: req.siteID,
                customerID: req.userId,
                level: "error",
                type: "product",
                message: func.onCatchCreateLogMSG(err),
                sysOperation: "create",
                sysLevel: "product"
              });
              res.status(500).json({ error: err });
            });
        }
      } else {
        res.status(401).send(variables.errorMsg.unauthorized);
      }
    }
  }
);

/////////////////////////////////////////////////
////////////////    DELETE    ///////////////////
/////////////////////////////////////////////////

productRouter.delete(
  "/removeproducts",
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

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    } else {
      // Check Edit level
      const editLevel = await Site.findById(req.siteID);
      if (req.authLevel == editLevel.editProd) {
        let data = req.body;
        let by = {};
        try {
          if (!!data._id) by._id = data._id;
          if (!!data.categoryID) {
            by.siteID = req.siteID; // This will delete all products connected with that web site if we remove categories
            by.categoryID = data.categoryID;
          }

          Products.remove(by).then(() => {
            logMSG({
              siteID: req.siteID,
              customerID: req.userId,
              level: "information",
              message: `Product was removed successfully.`,
              sysOperation: "delete",
              sysLevel: "product"
            });
            res.status(200).send(variables.successMsg.remove);
          });
        } catch (err) {
          return res.json(variables.errorMsg.notfound);
        }
      } else {
        res.status(401).send(variables.errorMsg.unauthorized);
      }
    }
  }
);
// // Dangerous function
// productRouter.post(
//   "/removeAllProductByCategory",
//   func.checkAuthenticated,
//   async (req, res) => {
//     check("userId")
//       .not()
//       .isEmpty()
//       .isString();
//     check("siteID")
//       .not()
//       .isEmpty()
//       .isString();
//     check("name")
//       .trim()
//       .not()
//       .isEmpty()
//       .isString();
//     check("authLevel")
//       .not()
//       .isEmpty()
//       .isString()
//       .isLength({ min: 2, max: 3 });
//     sanitizeBody("notifyOnReply").toBoolean();

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(422).json({ errors: errors.array() });
//     } else {
//       let data = req.body;
//       try {
//         let by = { siteID: req.siteID, categoryID: data.categoryID };
//         // This will delete all products connected with that category or subcategory
//         Products.remove(by).then(() => {
//           logMSG({
//             siteID: req.siteID,
//             customerID: req.userId,
//             level: "information",
//             message: `All product by category ID '${
//               data.categoryID
//             }' were removed successfully.`,
//             sysOperation: "delete",
//             sysLevel: "product"
//           });
//           res.status(201).send(variables.successMsg.remove);
//         });
//       } catch (err) {
//         return res.json(variables.errorMsg.notfound);
//       }
//     }
//   }
// );


// productRouter.post('/removeAllproductsByCustomer', func.checkAuthenticated, async (req, res) => {
//     try {
//         if (req.userId == void 0)
//             return res.status(400).send(variables.errorMsg.invalidData);

//         // This will delete all products connected with that customer / web site
//         Products.remove({ customer: req.userId }).exec(
//             res.status(201).send(variables.successMsg.remove)
//         );
//     } catch (err) {
//         return res.json(variables.errorMsg.notfound);
//     }
// });


module.exports = productRouter;
