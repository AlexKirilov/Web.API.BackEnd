const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./connectionDB');

const app = express();
const http = require('https').Server(app);

connectDB();

app.use(cors());
app.use(bodyParser.json());

app.use('/logs', require('./access/logs'));
app.use('/auth', require('./access/auth'));
// app.use('/logs',  require('./access/siteLogs'));
app.use('/orders', require('./accessData/orders'));
app.use('/authdata', require('./access/authCU'));
app.use('/gallery', require('./accessData/gallery'));
app.use('/sitetype', require('./access/siteType'));
app.use('/category', require('./accessData/category'));
app.use('/invoices', require('./accessData/Invoice'));
app.use('/comments', require('./access/comments'));
app.use('/sitedata', require('./access/siteData'));
app.use('/customers', require('./access/customers'));
app.use('/dashboard', require('./accessData/dashboard'));
app.use('/invoicecustomersdata', require('./accessData/InvoiceCustomerDataFunc'));
app.use('/datatoolsWS', require('./access/DataToolsTmp'));
app.use('/store', require('./accessData/product'));

// app.use('/stellar-age', require('./stellarAge/stellarAge'));

const port = process.env.PORT || 4567;
const host = process.env.HOST || '0.0.0.0'
const serverT = http.listen(port, host, () => console.log('Server started: ', port, host));

serverT.on('clientError', (err, socket) => {
  console.error(err);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
