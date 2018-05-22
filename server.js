let express = require('express');
let cors = require('cors');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let jwt = require('jwt-simple');

let login = require('./login');
let auth = require('./access/auth');
let siteType = require('./access/siteType');
let customers = require('./access/customers');
let category = require('./accessData/category');
let storeProducts = require('./accessData/product');
let InvoiceCustomerDataFunc = require('./accessData/InvoiceCustomerDataFunc');

let app = express();

mongoose.Promise = Promise;

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', auth);
// app.use('/user', login);
app.use('/sitetype', siteType);
app.use('/customers', customers);
app.use('/category', category);
app.use('/invoicecustomerdata', InvoiceCustomerDataFunc);

app.use('/store', storeProducts);

mongoose.connect('mongodb://studentapitest:studentapitestadmin@ds119080.mlab.com:19080/studentapi', (err) => {
    if (!err) console.log('connected to mongo');
})

app.listen( process.env.PORT || 3000);

//On each new customer create new tables // TEST