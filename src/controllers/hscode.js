const httpStatus = require('http-status');
const { respond } = require('../utils/response');
const { hsCodeRepository } = require('../repositories');

const all = async (req, res) => {
  const hscode = await hsCodeRepository.all();
  return respond(res, httpStatus.OK, null, hscode);
};

const single = async (req, res) => {
  const { id } = req.params;
  const hscode = await hsCodeRepository.single(id);
  if (!hscode) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified hscode.');
  }
  return respond(res, httpStatus.OK, null, hscode);
};

module.exports = {
  all,
  single,
};
