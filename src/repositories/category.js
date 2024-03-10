const base = require('./base');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { Category } = require('../models');
const db = require('../config/database');
const { Op } = require('sequelize');

/**
 * Gets all the categories from the database.
 *
 * @returns {*}
 */
const all = () => {
  return base.all(Category);
};

const categoryForms = () => {
  let query = readFileSync(resolve(__dirname, '../sql/category.sql')).toString();
  return db.query(query);
};

/**
 * Gets all paginate categories from the database.
 * @param limit
 * @param offset
 * @returns {Promise<{rows: Model[], count: number}>}
 */
const allPaginate = (limit, offset) => {
  return Category.findAndCountAll({
    where: { isDeleted: false },
    limit,
    offset,
  });
};

const searchPaginate = (limit, offset, search) => {
  return Category.findAndCountAll({
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
  return base.find(Category, needle, column);
};

/**
 * Stores a new category.
 *
 * @param data
 */
const store = async (data) => {
  return Category.create({
    name: data.name,
    parentId: data.parentId,
    iconFile: data.iconFile,
    otherServices: data.otherServices,
    otherServicesUrl: data.otherServicesUrl,
  });
};

/**
 * Updates a specific category.
 *
 * @param id
 * @param data
 */
const update = async (id, data) => {
  await Category.update(
    {
      name: data.name,
      parentId: data.parentId,
      iconFile: data.iconFile,
      otherServices: data.otherServices,
      otherServicesUrl: data.otherServicesUrl,
    },
    { where: { id } }
  );
  return true;
};

/**
 * Updates a specific category.
 *
 * @param id
 * @param data
 */
const updateStatus = async (id, data) => {
  await Category.update({ isActive: data.isActive }, { where: { id } });
  return true;
};

/**
 * Soft deletes a specific category.
 *
 * @param id
 * @returns {Promise<boolean>}
 */
const destroy = async (id) => {
  await Category.update({ isDeleted: true }, { where: { id } });
  return true;
};

module.exports = {
  all,
  categoryForms,
  allPaginate,
  find,
  store,
  update,
  destroy,
  updateStatus,
  searchPaginate,
};
