const validator = require('../utils/validation');

/**
 * Validates a role action request.
 *
 * @param req
 * @param res
 * @param next
 */
const action = async (req, res, next) => {
  validator(req.body, {
    actionId: 'required',
    // comment: 'required',
  });
  next();
};

module.exports = {
  action,
};
