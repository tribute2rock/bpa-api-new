const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { sendRestPasswordEmail } = require('../channels/email/send_email');
const { Customer } = require('../models');
const { customerRepository } = require('../repositories');
const { getPagingData, getPagination } = require('../utils/pagination');
const { respond } = require('../utils/response');
const argon2 = require('argon2');

const all = async (req, res) => {
  const { searchParam } = req.query;

  let users;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let usersData;

    usersData = await customerRepository.searchPaginate(limit, offset, req.query.search);
    users = getPagingData(usersData, page, limit, offset);
  } else {
    users = await customerRepository.all(searchParam);
  }

  return respond(res, httpStatus.OK, 'All user lists', users);
};

const resetPassword = async (req, res) => {
  const { id } = req.body;

  if (!id) throw new Error('Undefinded');

  const password = Math.random().toString(36).slice(-8);
  // generate hash password
  const hasedPassword = await argon2.hash(password, { type: argon2.argon2id });

  await Customer.update({ passwordExpire: true, password: hasedPassword }, { where: { id } });

  const customer = await Customer.findOne({ where: { id } });
  // send password to email
  await sendRestPasswordEmail({ name: customer.accountName, email: customer.email, password });

  return respond(res, httpStatus.OK, 'Password reset sucess');
};
module.exports = { all, resetPassword };
