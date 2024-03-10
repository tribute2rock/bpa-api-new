const authValidation = require('./auth');
const formValidation = require('./form');
const roleValidation = require('./role');
const userValidation = require('./user');
const departmentValidation = require('./department');
const categoryValidation = require('./category');
const requestValidation = require('./request');
const groupValidation = require('./group');
const exportValidation = require('./requestExport');

module.exports = {
  authValidation,
  formValidation,
  roleValidation,
  userValidation,
  departmentValidation,
  categoryValidation,
  requestValidation,
  groupValidation,
  exportValidation,
};
