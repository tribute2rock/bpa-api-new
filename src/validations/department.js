const validator = require('../utils/validation');

/**
 * Validates a department store request.
 *
 * @param req
 * @param res
 * @param next
 */
const store = async (req, res, next) => {
  validator(req.body, {
    name: 'required',
    description: 'required',
  });
  next();
};

/**
 * Validates a department update request.
 *
 * @param req
 * @param res
 * @param next
 */
const update = async (req, res, next) => {
  validator(req.body, {
    name: 'required',
    description: 'required',
  });
  next();
};

module.exports = {
  store,
  update,
};
