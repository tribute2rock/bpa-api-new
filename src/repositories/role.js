const base = require('./base');
const { Role, RolePermission, Permission } = require('../models');
const { Op } = require('sequelize');
const { Status } = require('../constants/response');
const { systemLogsQurey, difference } = require('../config/logs');
var log_query, log_schema, logs_obj, final_logs_obj, logOutput;

/**
 * Gets all the roles from the database.
 *
 * @returns {*}
 */
const all = () => {
  return Role.findAll({ where: { isDeleted: false }, order: [['createdAt', 'ASC']] });
};

/**
 * Gets all the roles from the database.
 *
 * @returns {*}
 */
const allPaginate = (limit, offset) => {
  return Role.findAndCountAll({ where: { isDeleted: false }, limit, offset });
};

const searchPaginate = (limit, offset, search) => {
  return Role.findAndCountAll({ where: { isDeleted: false, name: { [Op.substring]: search } }, limit, offset });
};

/**
 * Finds and gets a specific role.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(Role, needle, column);
};

/**
 * Gets a specific role and its permissions.
 *
 * @returns {*}
 */
const single = async (id) => {
  const role = await Role.findOne({
    where: {
      id,
    },
  });
  let middle = await RolePermission.findAll({
    where: {
      roleId: id,
    },
    attributes: ['permissionId'],
  });
  middle = Array.from(middle, (x) => x.permissionId);
  const permissions = await Permission.findAll({
    where: {
      id: middle,
    },
  });
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    createdAt: role.createdAt,
    permissions,
  };
};

/**
 * Stores a new role.
 *
 * @param data
 */
const store = async (data, logs_data) => {
  const role = await Role.create(
    {
      name: data.name,
      description: data.description,
    },
    { logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)) }
  );
  let modelName = log_schema.model;
  logs_obj = {
    queryExecute: log_query,
    queryType: log_schema?.type,
    model: modelName?.name,
  };
  final_logs_obj = { ...logs_data, ...logs_obj };
  logOutput = await systemLogsQurey(final_logs_obj);
  if (!logOutput) return false;

  await data.permissions.forEach(async (permission) => {
    await RolePermission.create(
      {
        roleId: role.id,
        permissionId: permission,
      },
      { logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)) }
    );
  });
  modelName = log_schema.model;
  logs_obj = {
    queryExecute: log_query,
    queryType: log_schema?.type,
    model: modelName?.name,
  };
  final_logs_obj = { ...logs_data, ...logs_obj };
  logOutput = await systemLogsQurey(final_logs_obj);
  if (!logOutput) return false;
  return role;
};

/**
 * Updates a specific role.
 *
 * @param id
 * @param data
 */
const update = async (id, data, logs_data) => {
  const role = await Role.update(
    { name: data.name, description: data.description },
    { where: { id }, logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)), returning: true }
  );
  let modelName = log_schema.model;
  logs_obj = {
    queryExecute: log_query,
    queryType: log_schema?.type,
    model: modelName?.name,
  };
  final_logs_obj = { ...logs_data, ...logs_obj };
  logOutput = await systemLogsQurey(final_logs_obj);
  if (!logOutput) return false;

  await RolePermission.destroy({
    where: { roleId: id },
    logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)),
    returning: true,
  });
  modelName = log_schema.model;
  logs_obj = {
    queryExecute: log_query,
    queryType: log_schema?.type,
    model: modelName?.name,
  };
  final_logs_obj = { ...logs_data, ...logs_obj };
  logOutput = await systemLogsQurey(final_logs_obj);
  if (!logOutput) return false;

  await data.permissions.forEach(async (permission) => {
    await RolePermission.create(
      {
        roleId: id,
        permissionId: permission,
      },
      { logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)) }
    );
  });
  modelName = log_schema.model;
  logs_obj = {
    queryExecute: log_query,
    queryType: log_schema?.type,
    model: modelName?.name,
  };
  final_logs_obj = { ...logs_data, ...logs_obj };
  logOutput = await systemLogsQurey(final_logs_obj);
  if (!logOutput) return false;
  return role;
};

/**
 * Soft deletes a specific role.
 *
 * @param id
 * @returns {Promise<boolean>}
 */
const destroy = async (id, logs_data) => {
  await Role.update(
    { isDeleted: true },
    { where: { id }, logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)), returning: true }
  );
  let modelName = log_schema.model;
  logs_obj = {
    queryExecute: log_query,
    queryType: log_schema?.type,
    model: modelName?.name,
  };
  final_logs_obj = { ...logs_data, ...logs_obj };
  logOutput = await systemLogsQurey(final_logs_obj);
  if (!logOutput) return false;
  return true;
};

module.exports = {
  all,
  allPaginate,
  find,
  store,
  update,
  destroy,
  single,
  searchPaginate,
};
