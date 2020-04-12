const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const auth = require('./access/auth');
const authCU = require('./access/authCU');
// const siteLogs = require('./access/siteLogs');
const logs = require('./access/logs');
const siteType = require('./access/siteType');
const orders = require('./accessData/orders');
const siteData = require('./access/siteData');
const comments = require('./access/comments');
const customers = require('./access/customers');
const dashboard = require('./accessData/dashboard');
const gallery = require('./accessData/gallery');
const Invoices = require('./accessData/Invoice');
const category = require('./accessData/category');
const storeProducts = require('./accessData/product');
const InvoiceCustomerDataFunc = require('./accessData/InvoiceCustomerDataFunc');
const DataToolsTMP = require('./access/DataToolsTmp');

const options = {
    allowUpgrades: true,
    transports: ['polling', 'websocket'],
    pingTimeout: 9000,
    pingInterval: 3000,
    cookie: 'mycookie',
    httpCompression: true,
    origins: '*:*'
};

const stellarAge = require('./stellarAge/stellarAge');
const app = express();
const client = require('socket.io');
client.listen(4567).sockets;

mongoose.Promise = Promise;

app.use(cors());
app.use(bodyParser.json());

app.use('/logs', logs);
app.use('/auth', auth);
// app.use('/logs', siteLogs);
app.use('/orders', orders);
app.use('/authdata', authCU);
app.use('/gallery', gallery);
app.use('/sitetype', siteType);
app.use('/category', category);
app.use('/invoices', Invoices);
app.use('/comments', comments);
app.use('/sitedata', siteData);
app.use('/customers', customers);
app.use('/dashboard', dashboard);
app.use('/invoicecustomersdata', InvoiceCustomerDataFunc);
app.use('/datatoolsWS', DataToolsTMP);
app.use('/store', storeProducts);

app.use('/stellar-age', stellarAge);

mongoose.connect('mongodb://studentapitest:studentapitestadmin@ds119080.mlab.com:19080/studentapi', { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (!err) console.log('connected to mongo');

    client.on('connection', (socket) => {
        let chat = db.collection('chat');

        // create func to send status
        sendStatus = (s) => {
            socket.emit('status', s);
        }

        chat.find().limit(50).sort({ _id: 1 }).toArray((err, res) => {
            if (err) { throw err; }
            socket.emit('output', res);
        });

        socket.on('input', (data) => {
            chat.insertOne(data, () => {
                client.emit('output', data);

                sendStatus({
                    message: 'Message send',
                    clear: true
                })
            });
        });

        socket.on('clear', (data) => {
            chat.deleteMany({}, () => {
                socket.emit('cleared');
            })
        })
    });



})

app.listen(process.env.PORT || 3000);

//On each new customer create new tables // TEST