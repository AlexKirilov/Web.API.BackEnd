const { check, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const func = require("../func");
const variables = require("../var");
const SiteLogs = require("../models/SiteLogs");
const express = require("express");
const logsRouter = express.Router();

logsRouter.get("/getLogs", func.getSiteID, (req, res) => {
  check("siteID")
    .not()
    .isEmpty();
  check("userId")
    .not()
    .isEmpty();
  sanitizeBody("notifyOnReply").toBoolean();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    const data = req.body;
    const query = req.query;

    const perPage = parseInt(query.perPage) || 20;
    const page = parseInt(query.page) || 1;
    const sort = convertSort(query.sort || {});
    const skip = page == 1 ? 0 : (page - 1) * perPage;
    let by = {};
    if (!!data.type) by.type = data.type;
    if (!!data.level) by.level = data.level;
    if (!!data.date) by.logDateTime = data.date;

    SiteLogs.find(by, "-__v")
      .sort(sort)
      .skip(skip)
      .limit(perPage)
      .exec()
      .then(results => {
        SiteLogs.countDocuments({}).then(count => {
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
        res.status(500).json({ error: err });
      });
  }
});

logsRouter.post("/getSiteLogs", func.getSiteID, (req, res) => {
  check("siteID")
    .not()
    .isEmpty();
  check("userId")
    .not()
    .isEmpty();
  sanitizeBody("notifyOnReply").toBoolean();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    const data = req.body;
    let by = {};
    by.siteID = req.siteID;
    if (!!data.type) {
      by.sysLevel = data.type;
    }
    if (!!data.level) {
      by.level = data.level;
    }
    if (!!data.date) {
      by.logDateTime = {
        $gte: newDate(data.date),
        $lt: newDate(
          newDate(data.date).setDate(newDate(data.date).getDate() + 1) - 1000
        )
      };
    }

    SiteLogs.find(by, "-__v -siteID -_id")
      .exec()
      .then(results => {
        res.status(200).send(results);
      })
      .catch(err => {
        res.status(500).json({ error: err });
      });
  }
});

logsRouter.get("/logDataFilter", (req, res) => {
  const data = {
    type: [
      { value: "", label: "All" },
      { value: "product", label: "Product" },
      { value: "invoice", label: "Invoice" },
      { value: "category", label: "Category" }
    ],
    level: [
      { value: "", label: "All" },
      { value: "fatal", label: "Fatal" },
      { value: "error", label: "Error" },
      { value: "warning", label: "Warning" },
      { value: "information", label: "Information" },
      { value: "debug", label: "Debug" }
    ]
  };
  res.send(data);
});

// message, levelType, siteID, ?customerId
logsRouter.post("/addLog", func.getSiteID, async (req, res) => {
  check("siteID")
    .not()
    .isEmpty();
  check("userId")
    .not()
    .isEmpty();
  sanitizeBody("notifyOnReply").toBoolean();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    let data = req.body;
    data.siteID = req.siteID;
    data.logDateTime = func.currentDate();

    new SiteLogs(data).save().then(result => {
      res.status(200).send(variables.successMsg.created);
    });
  }
});

logsRouter.post("/systemLogs", func.getSiteID, async (req, res) => {
  check("siteID")
    .not()
    .isEmpty();
  check("userId")
    .not()
    .isEmpty();
  sanitizeBody("notifyOnReply").toBoolean();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    let data = req.body;
    data.siteID = req.siteID;
    data.logDateTime = func.currentDate();

    new SiteLogs(data).save().then(result => {
      res.status(200).send(variables.successMsg.created);
    });
  }
});
// TODO: REMOVE Logs which are older then 100 days

logsRouter.delete("", func.getSiteID, async (req, res) => {
  check("siteID")
    .not()
    .isEmpty();
  check("userId")
    .not()
    .isEmpty();
  sanitizeBody("notifyOnReply").toBoolean();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    let data = req.body;
    data.siteID = req.siteID;

    SiteLogs.remove({ siteID: req.siteID }).then(() => {
      res.status(200).json('All Logs are removed from DB!');
    })
    .catch(err => {
        res.status(500).json({ error: err });
    });
  }
});

module.exports = logsRouter;

// function logMSG(data) {
//   new SiteLogs(data).save();
// }

function newDate(date) {
  return new Date(date);
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
