var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var jwt = require('jwt-simple');

var auth = require('./access/auth');
var dbtype = require('./access/dbType');
var mapChart = require('./access/mapChart');
var customers = require('./access/customers');
var categories = require('./accessData/category');
var storeProducts = require('./accessData/product');
var cuInvoiceDetails = require('./accessData/cuInvoiceDetails');

var variables = require('./var') //TODO: This should be removed at the END
var func = require('./func'); //TODO: This should be removed at the END

var app = express();

mongoose.Promise = Promise;

app.use(cors());
app.use(bodyParser.json());


app.use('/auth', auth);
app.use('/map', mapChart);
app.use('/webtype', dbtype);
app.use('/customers', customers);
app.use('/category', categories);
app.use('/cusinvoicedetails', cuInvoiceDetails);

app.use('/store', storeProducts);

app.get('/store/test', func.checkAuthenticated, (req, res) => {
    console.log(req.userId);
})
mongoose.connect('mongodb://studentapitest:studentapitestadmin@ds119080.mlab.com:19080/studentapi', (err) => {
    if (!err) console.log('connected to mongo');
})

app.listen( process.env.PORT || 3000);

//Forin Key command -- da sglobim 2 tablici zaedno
// author: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}