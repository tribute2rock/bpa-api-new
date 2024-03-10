const { logger } = require('../../config/logger');
const nodemailer = require('nodemailer');
const { EMAIL } = require('../../config');
// const { createRegistraionMailLogs } = require('./email_registration');

const transporter = nodemailer.createTransport({
  host: EMAIL.HOST,
  port: EMAIL.PORT,
  auth: {
    user: EMAIL.USERNAME,
    pass: EMAIL.PASSWORD,
  },
  secure: false,
});

module.exports.sendMessage = async (email) => {
  return transporter
    .sendMail({
      from: 'globalonline_noreply@gibl.com.np',
      ...email,
    })
    .then((info) => {
      if (info.rejected.length) {
        console.log(info.rejected, '-----------------mail rejected');
      }
      console.log(info, '-------------------mail send');
      // createRegistraionMailLogs(email, info);
      return info;
    })
    .catch((err) => {
      console.log(err, '-------------------mail error');

      // createRegistraionMailLogs(email, err);
    });
};

const transporterSwift = nodemailer.createTransport({
  host: EMAIL.HOST, //mail.gibl.com.np
  port: EMAIL.PORT, //587
  auth: {
    user: 'Trade2Swift',
    pass: 'Glob@L#2023',
  },
  secure: false,
});

module.exports.sendMessageToSwift = async (email) => {
  return transporterSwift
    .sendMail({
      from: 'trade2swift@gibl.com.np',
      ...email,
    })
    .then((info) => {
      if (info.rejected.length) {
        console.log(info.rejected, '-------mail reject on swift');
      }
      console.log(info, '------- mail send to swift');
      return info;
    })
    .catch((err) => {
      // logger.error(err);
      console.log(err, '-------mail error on swift');
    });
};
