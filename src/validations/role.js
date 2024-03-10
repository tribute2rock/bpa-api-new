const validator = require('../utils/validation');

/**
 * Validates a role store request.
 *
 * @param req
 * @param res
 * @param next
 */
const store = async (req, res, next) => {
  validator(req.body, {
    name: 'required',
    description: 'required',
    permissions: 'required',
  });
  next();
};

module.exports = {
  store,
};
