var express = require('express');
var cors = require('cors');
var app = express();

app.use(cors());

var posts = [
    {message: 'g' },
    {message: 'gt' },
];

app.get('/posts', function (req, res) {
    res.send(posts);
});

/*
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  
  app.get('/posts', function(req, res, next) {
    // Handle the get for this route
    res.send(posts);
  });
  
  app.post('/', function(req, res, next) {
   // Handle the post for this route
  });
 */

app.listen(3000);