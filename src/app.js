const express = require('express');
require('express-async-errors');
const helmet = require('helmet');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');
const morgan = require('./config/morgan');
const routes = require('./routes/v1');
const ErrorHandler = require('./utils/errors');

const app = express();
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', express.static('./public'));
if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

app.use(function (req, res, next) {
  res.removeHeader('X-Powered-By');
  next();
});

// set security HTTP headers
// TODO: configure helmet configuration
app.use(helmet());
// app.use(helmet.frameguard({
//   action: "allow-from",
//     domain: [
//       'http://192.168.214.73:8080',
//       'http://192.168.214.73:8081',
//       'http://192.168.214.73:8080',
//       'https://globalconnect.gibl.com.np',
//     ]
// }));

// parse json request body
app.use(bodyParser.json({ limit: '50mb' }));

// parse urlencoded request body
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.use(function(req, res, next) {
  const corsWhitelist = [
    'http://192.168.214.73:8080',
    'http://192.168.214.73:8081',
    'http://192.168.214.73:8080',
    'https://globalconnect.gibl.com.np',
  ];
  if (corsWhitelist.indexOf(req.headers.origin) !== -1) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
  next();
});
// app.options('*', cors());

require('./config/scheduler');

// v1 api routes
app.use('/api', routes);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
    if (err) {
      console.log('====================================');
      console.log(err);
      console.log('====================================');
      res.status(500).send(err.message);
    }
  });
});

app.use(ErrorHandler);

require('./config/database');

module.exports = app;
