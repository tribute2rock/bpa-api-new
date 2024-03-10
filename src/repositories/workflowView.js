const base = require('./base');
const { WorkflowView } = require('../models');

const all = () => {
  return base.all(WorkflowView);
};

module.exports = {
  all,
};
