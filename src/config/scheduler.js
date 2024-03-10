const schedule = require('node-schedule');
const { emptyTemp } = require('./ftpConfig');
const { resetReferenceNumber } = require('../controllers/referenceNumber');

schedule.scheduleJob('59 23 * * 6', function () {
  console.log('Temp folder clear - scheduler running!');
  emptyTemp('temp/');
});

schedule.scheduleJob('1 1 1 1 *', function () {
  console.log('Reset Reference Number - scheduler running!');
  resetReferenceNumber();
});
