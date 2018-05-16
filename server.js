var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var auth = require('./auth');
var jwt = require('jwt-simple');
var User = require('./models/User');

var app = express();

mongoose.Promise = Promise;

app.use(cors());
app.use(bodyParser.json());


app.use('/auth', auth.router);

app.get('/test', auth.checkAuthenticated, (req, res) => {
    console.log(req.userId);
})
mongoose.connect('mongodb://studentapitest:studentapitestadmin@ds119080.mlab.com:19080/studentapi', (err) => {
    if (!err) console.log('connected to mongo');
})

app.listen( process.env.PORT || 3000);

//Forin Key command -- da sglobim 2 tablici zaedno
// author: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}