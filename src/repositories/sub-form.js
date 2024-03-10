const { Op } = require('sequelize');
const { SubForm } = require('../models');
const base = require('./base');
const db = require('../config/database');
const { status } = require('../constants/request');

/**
 * Gets all the sub forms from the database.
 *
 * @returns {Promise<Form[]>}
 */
const all = async () => {
  const subforms = await db.query(`select id,
                                       name form,
                                       type,
                                       description,
                                       formData
                                       isDeleted,
                                       createdAt
                                from sub_forms `);
  return subforms[0];
};

const allPaginate = (limit, offset) => {
  return SubForm.findAndCountAll({
    where: { isDeleted: false },
    limit,
    offset,
  });
};

/**
 * Finds and gets a specific sub form.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(SubForm, needle, column);
};

/**
 * Counts the number of sub forms.
 *
 * @returns {Promise<{rows: Form[], count: number}>}
 */
const count = async () => {
  const c = await SubForm.findAndCountAll();
  return c.count;
};

/**
 * Stores a new sub form into the database.
 *
 * @param data
 * @returns {data}
 */
const store = (data) => {
  return SubForm.create(data);
};

/**
 * Updates a specific sub form.
 *
 * @param id
 * @param data
 * @returns {*}
 */
const update = (id, data) => {
  return SubForm.update(data, { where: { id } });
};

/**
 * Soft deletes a specific sub form.
 * @param id
 * @returns {*}
 */
const destroy = (id) => {
  return SubForm.update({ isDeleted: true }, { where: { id } });
};

module.exports = {
  all,
  allPaginate,
  find,
  store,
  update,
  destroy,
  count,
};
