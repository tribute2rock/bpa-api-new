const { PrintTemplate } = require('../models');
const base = require('./base');
const db = require('../config/database');
const { Op } = require('sequelize');
/**
 * Gets all the print templates.
 *
 * @returns {Promise<Form[]>}
 */
const all = async () => {
  return PrintTemplate.findAll({ where: { isDeleted: false } });
};

const allPaginate = async (limit, offset) => {
  return PrintTemplate.findAndCountAll({
    where: { isDeleted: false },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};

const searchPaginate = async (limit, offset, search) => {
  return PrintTemplate.findAndCountAll({
    where: { isDeleted: false, name: { [Op.substring]: search } },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};
/**
 * Finds and gets a specific template.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(PrintTemplate, needle, column);
};

/**
 * Stores a print template.
 *
 * @param data
 * @returns {data}
 */
const store = (data) => {
  return PrintTemplate.create(data);
};

/**
 * Updates a specific Template.
 *
 * @param id
 * @param data
 * @returns {*}
 */
const update = (id, data) => {
  return PrintTemplate.update(data, { where: { id } });
};

/**
 * Soft deletes a specific Template.
 * @param id
 * @returns {*}
 */
const destroy = (id) => {
  return PrintTemplate.update({ isDeleted: true }, { where: { id } });
};

module.exports = {
  all,
  find,
  store,
  update,
  destroy,
  allPaginate,
  searchPaginate,
};
