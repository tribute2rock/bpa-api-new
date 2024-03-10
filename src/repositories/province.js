const base = require('./base');
const { Province } = require('../models');
/**
 * Gets all the roles from the database.
 *
 * @returns {*}
 */
const all = () => {
  return Province.findAll();
};

/**
 * Finds and gets a specific role.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(Province, needle, column);
};

module.exports = {
  all,
  find,
};
