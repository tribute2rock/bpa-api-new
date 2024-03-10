const base = require('./base');
const { SystemRequestLogs, OtpEmailLogs } = require('../models');
const { Op } = require('sequelize');

const allSystemLogs = () => {
  return base.all(SystemRequestLogs);
};

const otpEmailLogs = () => {
  return base.all(OtpEmailLogs);
};

/**
 * Gets all paginate categories from the database.
 * @param limit
 * @param offset
 * @returns {Promise<{rows: Model[], count: number}>}
 */
const systemLogsPaginate = (limit, offset) => {
  return SystemRequestLogs.findAndCountAll({
    where: { isDeleted: false },
    limit,
    offset,
  });
};

const searchPaginate = (limit, offset, search) => {
  return SystemRequestLogs.findAndCountAll({
    where: { isDeleted: false, name: { [Op.substring]: search } },
    limit,
    offset,
  });
};

/**
 * Gets all paginate categories from the database.
 * @param limit
 * @param offset
 * @returns {Promise<{rows: Model[], count: number}>}
 */
const searchOTPEmailPaginate = (limit, offset) => {
  return OtpEmailLogs.findAndCountAll({
    where: { isDeleted: false },
    limit,
    offset,
  });
};

const OTPEmailPaginate = (limit, offset, search) => {
  return OtpEmailLogs.findAndCountAll({
    where: { isDeleted: false, name: { [Op.substring]: search } },
    limit,
    offset,
  });
};
/**
 * Finds and gets a specific category.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(SystemRequestLogs, needle, column);
};

module.exports = {
  allSystemLogs,
  otpEmailLogs,
  systemLogsPaginate,
  searchPaginate,
  searchOTPEmailPaginate,
  OTPEmailPaginate,
  find,
};
