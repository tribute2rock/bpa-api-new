const httpStatus = require('http-status');
const { workflowViewRepository } = require('../repositories');
const { respond } = require('../utils/response');

const getAll = async (req, res) => {
  const workflowView = await workflowViewRepository.all();
  console.log('ok', workflowView);
  return respond(res, httpStatus.OK, null, workflowView);
};

module.exports = {
  getAll,
};
