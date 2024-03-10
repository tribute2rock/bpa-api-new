const base = require('./base');
const { Customer, Role } = require('../models');
const role_user = require('../models/role_user');
const ad = require('../external/ad');
const { Op } = require('sequelize');

/**
 * Gets a user.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(Customer, needle, column);
};

const all = async () => {
  const customers = await Customer.findAll({});
  return customers;
};

const searchPaginate = async (limit, offset, search, searchParam) => {
  const result = await Customer.findAndCountAll({
    where: { isDeleted: false, customerType: 'corporate', ...(search ? { email: { [Op.substring]: search || '' } } : {}) },
    limit,
    offset,
  });

  return {
    count: result.count,
    rows: result.rows,
  };
};

module.exports = {
  find,
  all,
  searchPaginate,
};
