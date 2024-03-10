const httpStatus = require('http-status');
const { permissionRepository } = require('../repositories');
const { respond } = require('../utils/response');

/**
 * Returns all the available permissions on the system.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const index = async (req, res) => {
  const permissions = await permissionRepository.grouped();
  return respond(res, httpStatus.OK, null, permissions);
};

module.exports = {
  index,
};
