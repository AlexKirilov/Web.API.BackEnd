const { check, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const Gallery = require("../models/store/Gallery");
const express = require("express");
const galleryRouter = express.Router();
const func = require("../func");

galleryRouter.get("/get", func.getSiteID, (req, res) => {
  check("siteID")
    .not()
    .isEmpty()
    .isString();
  sanitizeBody("notifyOnReply").toBoolean();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    Gallery.find({ siteID: req.siteID })
      .exec()
      .then(data => {
        res.status(200).send(data);
      });
  }
});

galleryRouter.post("/add", func.getSiteID, (req, res) => {
  check("siteID").not().isEmpty().isString();
  check("images").not().isEmpty().isString();
  sanitizeBody("notifyOnReply").toBoolean();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
      const data = {
        siteID: req.siteID,
        images: req.body.images
      }
      Gallery.findOneAndUpdate({siteID: req.siteID}, data).then( (d) => {
          if (d == null) {
              new Gallery(data).save().then( e=> res.status(200).send(e));
          } else res.status(200).send(d)
      } );
  }
});

module.exports = galleryRouter;
