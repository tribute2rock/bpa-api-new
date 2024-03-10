const httpStatus = require('http-status');
const { User } = require('../models');
const { getPagingData } = require('../utils/pagination');
const { getPagination } = require('../utils/pagination');
const { userService } = require('../services');
const { userRepository, groupRepository } = require('../repositories');
const { respond } = require('../utils/response');
const db = require('../config/database');

/**
 * Returns all the users available in the system.
 *
 * @param {*} req
 * @param {*} res
 */
const all = async (req, res) => {
  const { searchParam } = req.query;

  let users;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let usersData;
    if (req.query?.search) {
      const search = req.query.search;
      usersData = await userRepository.searchPaginate(limit, offset, search);
    } else {
      usersData = await userRepository.allPaginate(limit, offset);
    }
    users = getPagingData(usersData, page, limit, offset);
  } else {
    users = await userRepository.all(searchParam);
  }
  return respond(res, httpStatus.OK, null, users);
};

/**
 * Returns all the users available in the system.
 *
 * @param {*} req
 * @param {*} res
 */
const allUsers = async (req, res) => {
  const users = await User.findAll({ where: { isDeleted: false } });
  return respond(res, httpStatus.OK, 'All user lists', users);
};

/**
 *  Returns User detail based on requested id
 *
 * @param {*} req
 * @param {*} res
 */
const single = async (req, res) => {
  const { id } = req.params;
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const user = await userRepository.single(id);
  if (!user) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified user.');
  }
  return respond(res, httpStatus.OK, null, user);
};

/**
 * Create a new user.
 *
 * @param {*} req
 * @param {*} res
 */
const store = async (req, res) => {
  let logs_data = req.log;
  const userExists = await User.findOne({ where: { email: req.body.email, isDeleted: false } });
  if (userExists) {
    return respond(res, httpStatus.CONFLICT, 'User already exists.');
  } else {
    const user = await userService.store(
      {
        roleId: req.body.roleId,
        email: req.body.email,
        solID: req.body.solId,
      },
      logs_data
    );
    return respond(res, httpStatus.CREATED, 'User created successfully.', user);
  }
};

/**
 * Updates a specific user details.
 *
 * @param req
 * @param res
 */
const update = async (req, res) => {
  const { id } = req.params;
  let logs_data = req.log;
  const user = await userRepository.find(id);
  if (!user) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified user.');
  }
  const updated = await userService.update(
    user.id,
    {
      roleId: req.body.roleId,
      solID: req.body.solId,
    },
    logs_data
  );
  if (!updated) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not update the user.');
  }
  return respond(res, httpStatus.CREATED, 'User updated successfully.');
};

/**
 * Soft deletes a specific user.
 *
 * @param req
 * @param res
 */
const destroy = async (req, res) => {
  const { id } = req.params;
  let logs_data = req.log;
  const user = await userRepository.find(id);
  if (!user) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified user.');
  }
  const deleted = await userService.destroy(id, logs_data);
  if (!deleted) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not delete the user.');
  }
  respond(res, httpStatus.OK, 'User deleted successfully.');
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const user = await userRepository.findStatus(id);
  if (!user) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified user.');
  }
  const updated = await userService.updateStatus(user.id, {
    isActive: req.body.isActive,
  });
  if (!updated) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not update the user.');
  }
  return respond(res, httpStatus.CREATED, 'User updated successfully.');
};

/**
 * Returns list of all resigned users.
 *
 * @param {*} req
 * @param {*} res
 */
const resUsers = async (req, res) => {
  const users = await User.findAll({ where: { isDeleted: false } });
  console.log(users);
  return respond(res, httpStatus.OK, 'All resigned user', users);
};

module.exports = {
  all,
  allUsers,
  store,
  update,
  destroy,
  updateStatus,
  single,
  resUsers,
};
