const loginController = require('./login');
const permissionsController = require('./permissions');
const rolesController = require('./roles');
const customersController = require('./customers');
const usersController = require('./users');
const workflowController = require('./workflow');
const workflowViewController = require('./workflowView');
const formsController = require('./forms');
const subFormsController = require('./sub-forms');
const utilsController = require('./utils');
const ldapController = require('./ldap');
const departmentsController = require('./departments');
const categoriesController = require('./categories');
const requestsController = require('./requests');
const draftRequestController = require('./draftRequest');
const groupController = require('./groups');
const branchController = require('./branch');
const printController = require('./printTemp');
const fieldValidationsController = require('./fieldValidations');
const hsCodeController = require('./hscode');
const sanctionListController = require('./sanction_list');
const ReferenceNumberController = require('./referenceNumber');
const triggerController = require('./triggers');
const seedController = require('./seedController');
const logsController = require('./logs');
const reportController = require('./reportController');
module.exports = {
  loginController,
  permissionsController,
  rolesController,
  usersController,
  workflowController,
  workflowViewController,
  formsController,
  subFormsController,
  utilsController,
  ldapController,
  departmentsController,
  categoriesController,
  requestsController,
  draftRequestController,
  customersController,
  groupController,
  branchController,
  printController,
  fieldValidationsController,
  hsCodeController,
  sanctionListController,
  ReferenceNumberController,
  triggerController,
  seedController,
  logsController,
  reportController
};
