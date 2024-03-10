const base = require('./base');
const { Branch } = require('../models');
const { respond } = require('../utils/response');
const { Op } = require('sequelize');

/**
 * Gets all the branch from the database.
 *
 * @returns {*}
 */
const all = () => {
  return Branch.findAll({ where: { isDeleted: false } });
};

const allPaginate = (limit, offset) => {
  return Branch.findAndCountAll({
    where: { isDeleted: false },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};

const searchPaginate = (limit, offset, search) => {
  return Branch.findAndCountAll({
    where: { isDeleted: false, name: { [Op.substring]: search } },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Finds and gets a specific branch.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(Branch, needle, column);
};

/**
 * Updates a new branch.
 *
 * @param id
 * @param data
 */
const store = async (data) => {
  const branch = await Branch.create({
    name: data.name,
    sol: data.sol,
    lc_decentralized: data.lc_decentralized,
    bg_decentralized: data.bg_decentralized,
    bg_type: data.bg_type,
  });
  return branch;
};

const single = async (id) => {
  const branch = await Branch.findOne({
    where: {
      id,
    },
  });
  return {
    branch,
  };
};

/**
 * Updates a specific branch.
 *
 * @param id
 * @param data
 */
const update = async (id, data) => {
  await Branch.update(
    {
      name: data.name,
      sol: data.sol,
      lc_decentralized: data.lc_decentralized,
      bg_decentralized: data.bg_decentralized,
      bg_type: data.bg_type,
    },
    { where: { id } }
  );

  return true;
};

const destroy = async (id) => {
  // await Branch.update({ isDeleted: true }, { where: { id } });
  await Branch.destroy({ where: { id } });
  return true;
};

module.exports = {
  all,
  allPaginate,
  searchPaginate,
  find,
  store,
  update,
  destroy,
  single,
};
