const base = require('./base');
const { Department } = require('../models');
/**
 * Gets all the departments from the database.
 *
 * @returns {*}
 */
const all = () => {
  return base.all(Department);
};

/**
 * Finds and gets a specific department.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(Department, needle, column);
};

/**
 * Stores a new department.
 *
 * @param data
 */
const store = async (data) => {
  return Department.create({ name: data.name, description: data.description });
};

/**
 * Updates a specific department.
 *
 * @param id
 * @param data
 */
const update = async (id, data) => {
  await Department.update({ name: data.name, description: data.description }, { where: { id } });
  return true;
};

/**
 * Soft deletes a specific department.
 *
 * @param id
 * @returns {Promise<boolean>}
 */
const destroy = async (id) => {
  await Department.update({ isDeleted: true }, { where: { id } });
  return true;
};

module.exports = {
  all,
  find,
  store,
  update,
  destroy,
};
