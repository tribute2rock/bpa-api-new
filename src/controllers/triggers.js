const httpStatus = require('http-status');
const { Customer } = require('../models');
const { respond } = require('../utils/response');
const db = require('../config/database');
const argon2 = require('argon2');
const { sendAuthorizationEmail } = require('../channels/email/send_email');
const { create } = require('../repositories/trigger');
/**
 * Registers corporate user in the system.
 *
 * @param {*} req
 * @param {*} res
 */
const registerCorporate = async (data) => {
  const randomstring = Math.random().toString(36).slice(-8);
  // console.log(randomstring, 'RandomPASS');
  const pass = await argon2.hash(randomstring, { type: argon2.argon2id });
  const corporateCustomer = {
    email: data.registration_email,
    mobileNumber: data.registration_mobile_number,
    accountNumber: data.registration_account_number,
    accountName: data.registration_account_name,
    customerType: 'CORPORATE',
    password: pass,
    passwordExpire: 1,
  };

  const register = await create(corporateCustomer);
  if (register.status) {
    await sendAuthorizationEmail({
      name: data.registration_account_name,
      password: randomstring,
      email: corporateCustomer.email,
      // email: 'aryan@generaltechnology.com.np',
    });
    return { status: true, code: 1, message: register.message, email: corporateCustomer.email };
    // return respond(res, httpStatus.OK, register.message, { email: data.email });
  } else {
    return { status: true, code: 0, message: register.message };
    // return respond(res, httpStatus.OK, register.message);
  }
};

module.exports = {
  registerCorporate,
};
