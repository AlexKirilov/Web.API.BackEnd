const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jwt-simple');

const auth = require('./access/auth');
const siteLogs = require('./access/siteLogs');
const siteType = require('./access/siteType');
const siteData = require('./access/siteData');
const comments = require('./access/comments');
const customers = require('./access/customers');
const gallery  = require('./accessData/gallery');
const Invoices = require('./accessData/Invoice');
const category = require('./accessData/category');
const storeProducts = require('./accessData/product');
const InvoiceCustomerDataFunc = require('./accessData/InvoiceCustomerDataFunc');
const app = express();

mongoose.Promise = Promise;

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/logs', siteLogs);
app.use('/gallery', gallery);
app.use('/sitetype', siteType);
app.use('/category', category);
app.use('/invoices', Invoices);
app.use('/comments', comments);
app.use('/sitedata', siteData);
app.use('/customers', customers);
app.use('/invoicecustomersdata', InvoiceCustomerDataFunc);

app.use('/store', storeProducts);

mongoose.connect('mongodb://studentapitest:studentapitestadmin@ds119080.mlab.com:19080/studentapi', (err) => {
    if (!err) console.log('connected to mongo');
})

app.listen( process.env.PORT || 3000);

//On each new customer create new tables // TEST