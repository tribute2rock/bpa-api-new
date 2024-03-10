const userRepository = require('./user');
const workflowRepository = require('./workflow');
const workflowViewRepository = require('./workflowView');
const roleRepository = require('./role');
const permissionRepository = require('./permission');
const formRepository = require('./form');
const subformRepository = require('./sub-form');
const ldapRepository = require('./ldap');
const departmentRepository = require('./department');
const branchRepository = require('./branch');
const provinceRepository = require('./province');
const utilRepository = require('./utils');
const categoryRepository = require('./category');
const requestRepository = require('./request');
const customerRepository = require('./customer');
const fileRepository = require('./file');
const groupRepository = require('./group');
const printRepository = require('./printTemp');
const draftRequestRepository = require('./draftRequest');
const hsCodeRepository = require('./hscode');
const triggerRepository = require('./trigger');
const sanctionListRepository = require('./sanction_list');
const logsRepository = require('./logs');

module.exports = {
  userRepository,
  roleRepository,
  permissionRepository,
  workflowRepository,
  workflowViewRepository,
  formRepository,
  subformRepository,
  utilRepository,
  ldapRepository,
  departmentRepository,
  branchRepository,
  provinceRepository,
  categoryRepository,
  requestRepository,
  customerRepository,
  fileRepository,
  groupRepository,
  printRepository,
  draftRequestRepository,
  hsCodeRepository,
  triggerRepository,
  sanctionListRepository,
  logsRepository,
};
