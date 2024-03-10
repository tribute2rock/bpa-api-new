const { SystemRequestLogs, OtpEmailLogs } = require('../models');

const systemLogsQurey = async (logs) => {
  try {
    const createdRequestLogs = await SystemRequestLogs.create(logs);
    // console.log('out', createdRequestLogs);
    if (createdRequestLogs) {
      // console.log('params');
      // createdRequestLogs,
      return true;
    } else {
      false;
    }
  } catch (error) {
    console.log(error);
  }
};

const otpEmailLogs = async (logs) => {
  try {
    const createdOtpEmailLogs = await OtpEmailLogs.create(logs);
    // console.log('out', createdRequestLogs);
    if (createdOtpEmailLogs) {
      console.log('params');
      // createdRequestLogs,
      return true;
    } else {
      false;
    }
  } catch (error) {
    console.log(error);
  }
};

const difference = async (object, base) => {
  var result = {};
  var keys = Object.keys(base);

  for (var key in object) {
    if (!keys.includes(key)) {
      result[key] = object[key];
    }
  }
  return result;
};

module.exports = {
  systemLogsQurey,
  otpEmailLogs,
  difference,
};
