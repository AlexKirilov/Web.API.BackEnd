let express = require('express');
let cors = require('cors');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let jwt = require('jwt-simple');

let auth = require('./access/auth');
let siteLogs = require('./access/siteLogs');
let siteType = require('./access/siteType');
let siteData = require('./access/siteData');
let comments = require('./access/comments');
let customers = require('./access/customers');
let Invoices = require('./accessData/Invoice');
let category = require('./accessData/category');
let storeProducts = require('./accessData/product');
let InvoiceCustomerDataFunc = require('./accessData/InvoiceCustomerDataFunc');

let app = express();

mongoose.Promise = Promise;

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/logs', siteLogs);
app.use('/sitetype', siteType);
app.use('/category', category);
app.use('/invoices', Invoices);
app.use('/comments', comments);
app.use('/customers', customers);
app.use('/sitedata', siteData);
app.use('/invoicecustomersdata', InvoiceCustomerDataFunc);

app.use('/store', storeProducts);

mongoose.connect('mongodb://studentapitest:studentapitestadmin@ds119080.mlab.com:19080/studentapi', (err) => {
    if (!err) console.log('connected to mongo');
})

app.listen( process.env.PORT || 3000);

//On each new customer create new tables // TEST