let express = require('express');
let cors = require('cors');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let jwt = require('jwt-simple');

let login = require('./login');
let auth = require('./access/auth');
let dbtype = require('./access/dbType');
let mapChart = require('./access/mapChart');
let customers = require('./access/customers');
let categories = require('./accessData/category');
let storeProducts = require('./accessData/product');
let cuInvoiceDetails = require('./accessData/cuInvoiceDetails');

let app = express();

mongoose.Promise = Promise;

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', auth);
// app.use('/user', login);
app.use('/map', mapChart);
app.use('/webtype', dbtype);
app.use('/customers', customers);
app.use('/category', categories);
app.use('/cusinvoicedetails', cuInvoiceDetails);

app.use('/store', storeProducts);

mongoose.connect('mongodb://studentapitest:studentapitestadmin@ds119080.mlab.com:19080/studentapi', (err) => {
    if (!err) console.log('connected to mongo');
})

app.listen( process.env.PORT || 3000);

//On each new customer create new tables // TEST