const { check, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const SiteLogs = require("../models/SiteLogs");
const Customers = require("../models/Customers");
const Auth = require("../models/Auth");
const express = require("express");
const authCURouter = express.Router();
const func = require("../func");
const variables = require("../var");

function logMSG(data) {
    new SiteLogs(data).save();
}

authCURouter.post("/changeauthlevel", func.checkAuthenticated, (req, res) => {
  check("siteID")
    .not()
    .isEmpty();
  check("userId")
    .not()
    .isEmpty();
  check("levelAuth")
    .not()
    .isEmpty()
    .isString()
    .isLength({ min: 2, max: 3 });
  check("customerID")
    .not()
    .isEmpty()
    .isString();
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    const userData = req.body;
    Auth.findById(req.userId)
      .exec()
      .then(rest => {
        if (!rest) {
          res.status(404).json(variables.errorMsg.notfound);
        } else if (rest.levelAuth !== "AD" && rest.levelAuth !== "SA") {
          return res.status(401).send(variables.errorMsg.unauthorized); // Changed
        } else {
          Customers.findById(userData.customerID)
            .exec()
            .then(result => {
              if (result) {
                result.levelAuth = userData.levelAuth;
                switch (userData.levelAuth) {
                  case "AD":
                    result.type = "Admin";
                    break;
                  case "MN":
                    result.type = "Manager";
                    break;
                  case "EE":
                    result.type = "Employee";
                    break;
                  case "CU":
                    result.type = "Customer";
                    break;
                }
                Customers.findByIdAndUpdate(userData.customerID, result)
                  .exec()
                  .then(() => {
                    logMSG({
                      siteID: req.siteID,
                      customerID: req.userId,
                      type: "customer",
                      level: "information",
                      message: variables.successMsg.update.message,
                      sysOperation: "update",
                      sysLevel: "authlevel"
                    });
                    res.status(200).send(variables.successMsg.update);
                  });
                // .catch(err => {
                //     logMSG({
                //         siteID: req.siteID,
                //         customerID: req.userId,
                //         type: 'customer',
                //         level: 'error',
                //         message: func.onCatchCreateLogMSG(err),
                //         sysOperation: 'update',
                //         sysLevel: 'authlevel'
                //     });
                //     res.status(500).json({ error: err });
                // });
              } else {
                res.status(404).json(variables.errorMsg.notfound);
              }
            });
          // .catch(err => {
          //     logMSG({
          //         siteID: req.siteID,
          //         customerID: req.userId,
          //         type: 'auth',
          //         level: 'error',
          //         message: func.onCatchCreateLogMSG(err),
          //         sysOperation: 'update',
          //         sysLevel: 'authlevel'
          //     });
          //     res.status(500).json({ error: err });
          // });
        }
      })
      .catch(err => {
        logMSG({
          siteID: req.siteID,
          customerID: req.userId,
          type: "auth",
          level: "error",
          message: func.onCatchCreateLogMSG(err),
          sysOperation: "update",
          sysLevel: "authlevel"
        });
        res.status(500).json({ error: err });
      });
  }
});

authCURouter.post("/cudiscount", func.checkAuthenticated, (req, res) => {
  check("siteID")
    .not()
    .isEmpty();
  check("userId")
    .not()
    .isEmpty();
  check("personalDiscount")
    .not()
    .isEmpty()
    .not()
    .equals(0);
  check("levelAuth")
    .not()
    .isEmpty()
    .isString()
    .isLength({ min: 2, max: 3 });
  check("customerID")
    .not()
    .isEmpty()
    .isString();
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    const userData = req.body;
    Auth.findById(req.userId)
      .exec()
      .then(rest => {
        if (!rest) {
          res.status(404).json(variables.errorMsg.notfound);
        } else if (rest.levelAuth !== "AD" && rest.levelAuth !== "SA") {
          return res.status(401).send(variables.errorMsg.unauthorized); // Changed
        } else {
          Customers.findById(userData._id)
            .exec()
            .then(result => {
              if (result) {
                result.levelAuth = userData.levelAuth;
                result.personalDiscount = userData.personalDiscount;
                Customers.findByIdAndUpdate(result._id, result)
                  .exec()
                  .then((qqq) => {
                    logMSG({
                      siteID: req.siteID,
                      customerID: req.userId,
                      type: "customer",
                      level: "information",
                      message: variables.successMsg.update.message,
                      sysOperation: "update",
                      sysLevel: "auth customers"
                    });
                    res.status(200).send(variables.successMsg.update); // Changed
                  });
              } else {
                res.status(404).json(variables.errorMsg.notfound);
              }
            });
        }
      })
      .catch(err => {
        logMSG({
          siteID: req.siteID,
          customerID: req.userId,
          type: "auth",
          level: "error",
          message: func.onCatchCreateLogMSG(err),
          sysOperation: "update",
          sysLevel: "authlevel"
        });
        res.status(500).json({ error: err });
      });
  }
});

authCURouter.get('/getEmployees', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 }).equals('AD'); // .withMessage('AD')
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findOne({ siteID: req.siteID, _id: req.userId }).exec()
            .then(auth => {
                if (auth !== null) {
                    Customers.find({ siteID: req.siteID }, '-__v -password -siteID -created -GDPR -company').exec()
                        .then(result => {
                            res.status(200).send(result.filter(user => {
                                return user.levelAuth == 'EE' || user.levelAuth == 'MN';
                            }));
                        });
                }
            }).catch(err => {
                // Add new Log
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'employee'
                });
                res.status(500).json({ error: err });
            });
    }
});

// Update Employee only from Site Admin
authCURouter.post('/updateEmployee', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 }).equals('AD'); // .withMessage('AD')
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const data = req.body;
        Auth.findOne({ siteID: req.siteID, _id: req.userId }).exec()
            .then(auth => {
                if (auth !== null) {
                    Customers.findOneAndUpdate({ _id: data._id, siteID: req.siteID }, data)
                        .then(() => {
                            res.status(200).send(variables.successMsg.update);
                        });
                } else {
                    return res.status(404).send(variables.errorMsg.notfound)
                }
            }).catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'update',
                    sysLevel: 'employee'
                });
                res.status(500).json({ error: err });
            });
    }
});

//Required data for this call -> { "email": "mail@mail.com" }
authCURouter.get('/getAuthCustomer', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 });
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findOne({ siteID: req.siteID, _id: req.userId }).exec()
            .then(auth => {
                if (auth !== null) {
                    Customers.findOne({ siteID: req.siteID, email: auth.email }).exec()
                        .then(customer => {
                            if (customer !== null) { res.status(200).send(customer); }
                            else { res.status(404).send(variables.errorMsg.notfound); }
                        })
                } else {
                    res.status(404).send(variables.errorMsg.notfound);
                }
            })
            .catch(err => {
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'customer'
                });
                res.status(500).json({ error: err });
            });
    }
});

authCURouter.get('/getAuthCustomers', func.checkAuthenticated, (req, res) => {
    check('userId').not().isEmpty().isString();
    check('siteID').not().isEmpty().isString();
    check('authLevel').not().isEmpty().isString().isLength({ min: 2, max: 3 }).equals('AD'); // .withMessage('AD')
    sanitizeBody('notifyOnReply').toBoolean();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        Auth.findOne({ siteID: req.siteID, _id: req.userId }).exec()
            .then(auth => {
                if (auth !== null) {
                    Customers.find({ siteID: req.siteID }, '-__v -password -siteID -created -GDPR ').exec()
                        .then(result => {
                            res.status(200).send(result.filter(user => {
                                return user.levelAuth == 'CU';
                            }));
                        });
                }
            }).catch(err => {
                // Add new Log
                logMSG({
                    siteID: req.siteID,
                    customerID: req.userId,
                    level: 'error',
                    message: func.onCatchCreateLogMSG(err),
                    sysOperation: 'get',
                    sysLevel: 'auth customers'
                });
                res.status(500).json({ error: err });
            }
        );
    }
});

module.exports = authCURouter;