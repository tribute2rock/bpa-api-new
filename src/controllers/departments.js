const httpStatus = require('http-status');
const { departmentRepository } = require('../repositories');
const { departmentService } = require('../services');
const { respond } = require('../utils/response');

/**
 * Returns all the departments available in the system.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const all = async (req, res) => {
  const departments = await departmentRepository.all();
  return respond(res, httpStatus.OK, null, departments);
};

/**
 * Create a new department.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const store = async (req, res) => {
  const department = await departmentService.store({
    name: req.body.name,
    description: req.body.description,
  });
  respond(res, httpStatus.CREATED, 'New department created successfully.');
};

/**
 * Gets a specific department.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  const department = await departmentRepository.find(id);
  if (!department) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified department.');
  }
  respond(res, httpStatus.CREATED, null, department);
};

/**
 * Updates a specific department and its permissions.
 *
 * @param req
 * @param res
 */
const update = async (req, res) => {
  const { id } = req.params;
  const department = await departmentRepository.find(id);
  if (!department) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified department.');
  }
  const updated = await departmentService.update(department.id, {
    name: req.body.name,
    description: req.body.description,
  });
  if (!updated) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not update the department.');
  }
  return respond(res, httpStatus.OK, 'Department updated successfully.');
};

/**
 * Soft deletes a specific department.
 *
 * @param req
 * @param res
 */
const destroy = async (req, res) => {
  const { id } = req.params;
  const department = await departmentRepository.find(id);
  if (!department) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified department.');
  }
  const deleted = await departmentService.destroy(id);
  if (!deleted) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not delete the department.');
  }
  respond(res, httpStatus.OK, 'Role deleted successfully.');
};

module.exports = {
  all,
  store,
  update,
  destroy,
  single,
};
