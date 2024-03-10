const { Op } = require('sequelize');
const { Customer } = require('../models');
const db = require('../config/database');
const ad = require('../external/ad');
const base = require('./base');

/**
 * Creates a new corporate customer.
 *
 */
const create = async (customer) => {
  const custData = await Customer.findOne({
    where: {
      [Op.or]: [
        { mobileNumber: customer.mobileNumber },
        { email: customer.email },
        { accountNumber: customer.accountNumber },
      ],
    },
  });
  if (!custData) {
    const record = await Customer.create(customer);
    return { status: true, message: 'Corporate customer registered successfully.', data: record };
  }
  return { status: false, message: 'Customer record already exist.' };
};

module.exports = {
  create,
};
