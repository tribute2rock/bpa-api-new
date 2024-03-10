const validator = require('../utils/validation');

/**
 * Validates a category store request.
 *
 * @param req
 * @param res
 * @param next
 */
const store = async (req, res, next) => {
  validator(req.body, {
    name: 'required',
  });
  next();
};

/**
 * Validates a category update request.
 *
 * @param req
 * @param res
 * @param next
 */
const update = async (req, res, next) => {
  validator(req.body, {
    name: 'required',
  });
  next();
};

module.exports = {
  store,
  update,
};
