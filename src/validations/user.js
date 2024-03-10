const validator = require('../utils/validation');

/**
 * Validates a user store request.
 *
 * @param req
 * @param res
 * @param next
 */
const store = async (req, res, next) => {
  validator(req.body, {
    roleId: 'required',
  });
  next();
};

/**
 * Validates a user update request.
 *
 * @param req
 * @param res
 * @param next
 */
const update = async (req, res, next) => {
  validator(req.body, {
    roleId: 'required',
  });
  next();
};

module.exports = {
  store,
  update,
};
