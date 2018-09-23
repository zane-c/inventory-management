const bodyParser = require('body-parser');
const express = require('express');
const routes = require('./routes');

// Express Server
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const checkAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    if (token === 'XXX') {  
      // Valid auth - REPLACE WITH LEGITIMATE JWT VALIDATION
      next();
    } else {
      // Invalid auth
      res.sendStatus(401);
    }
  } else {
    // No token
    res.sendStatus(417);
  }
}

// Routes
app.use(checkAuth);
app.use('/', routes);
app.get('/', function(req, res) {
  res.send('API Version 1.0.0 - Inventory Manager');
});

app.listen(49152);
