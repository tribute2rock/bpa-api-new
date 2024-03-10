const httpStatus = require('http-status');
const { getPagingData } = require('../utils/pagination');
const { getPagination } = require('../utils/pagination');
const { roleRepository } = require('../repositories');
const { roleService } = require('../services');
const { respond } = require('../utils/response');
const { Role } = require('../models');

/**
 * Returns all the roles available in the system.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const all = async (req, res) => {
  const roles = await roleRepository.all();
  return respond(res, httpStatus.OK, null, roles);
};

const allPaginate = async (req, res) => {
  const { page, pageSize } = req.query;
  const { limit, offset } = getPagination(page, pageSize);
  let roles;
  if (req.query?.search) {
    const search = req.query.search;
    roles = await roleRepository.searchPaginate(limit, offset, search);
  } else {
    roles = await roleRepository.allPaginate(limit, offset);
  }
  const response = getPagingData(roles, page, limit, offset);
  return respond(res, httpStatus.OK, null, response);
};

/**
 * Create a new role.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const store = async (req, res) => {
  let logs_data = req?.log;
  const uniqueRole = await Role.findOne({ where: { isDeleted: false, name: req.body.name } });
  if (uniqueRole) {
    return respond(res, httpStatus.PRECONDITION_FAILED, 'Role already exists.');
  } else {
    const role = await roleService.store(
      {
        name: req.body.name,
        description: req.body.description,
        permissions: req.body.permissions,
      },
      logs_data
    );
    if (role) {
      respond(res, httpStatus.CREATED, 'New role created successfully.', role);
    } else {
      respond(res, httpStatus.NOT_FOUND, 'Role is not created');
    }
  }
};

/**
 * Gets a specific role.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  const role = await roleRepository.single(id);
  if (!role) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified role.');
  }
  respond(res, httpStatus.CREATED, null, role);
};

/**
 * Updates a specific role and its permissions.
 *
 * @param req
 * @param res
 */
const update = async (req, res) => {
  const { id } = req.params;
  let logs_data = req?.log;
  const role = await roleRepository.find(id);
  if (!role) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified role.');
  }
  const updated = await roleService.update(
    role.id,
    {
      name: req.body.name,
      description: req.body.description,
      permissions: req.body.permissions,
    },
    logs_data
  );
  if (!updated) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not update the role.');
  }
  return respond(res, httpStatus.OK, 'Role updated successfully.');
};

/**
 * Soft deletes a specific role.
 *
 * @param req
 * @param res
 */
const destroy = async (req, res) => {
  let logs_data = req?.log;
  const { id } = req.params;
  const role = await roleRepository.find(id);
  if (!role) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified role.');
  }
  const deleted = await roleService.destroy(id, logs_data);
  if (!deleted) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not delete the role.');
  }
  respond(res, httpStatus.OK, 'Role deleted successfully.');
};

module.exports = {
  all,
  allPaginate,
  store,
  update,
  destroy,
  single,
};
