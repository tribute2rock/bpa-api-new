/**
 * Service is an abstraction layer placed on top of the domain model which
 * encapsulates common application logic behind a single API so that it can be
 * easily consumed by different client layers.
 *
 * All the application services are registered here.
 *
 * Example: module.exports.authService = require('./auth.service');
 */

const userService = require('./user');
const formService = require('./form');
const subformService = require('./sub_form');
const roleService = require('./role');
const departmentService = require('./department');
const categoryService = require('./category');
const requestService = require('./request');
const groupService = require('./group');
const branchService = require('./branch');
const draftRequestService = require('./draftRequest');

module.exports = {
  userService,
  formService,
  subformService,
  roleService,
  departmentService,
  categoryService,
  requestService,
  groupService,
  branchService,
  draftRequestService,
};
