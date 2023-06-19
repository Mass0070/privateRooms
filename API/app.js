// app.js

const { axiosc } = require('./config.json');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Other code and middleware configurations

// Enable CORS for requests from a specific domain
const corsOptions = {
  origin: axiosc.url, // Replace with your allowed domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Show index file.
app.get("/", cors(corsOptions), async (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`Received ${req.method} request at ${req.url}`);
  next();
});

// Require and set up the permission routes
require('./routes/permissionRoutes')(app, corsOptions);

// Require and set up the staff routes
require('./routes/staffRoutes')(app, corsOptions);

// Require and set up the discord routes
require('./routes/discordRoutes')(app, corsOptions);

// Other routes and configurations

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});