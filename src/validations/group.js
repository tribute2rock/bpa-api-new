const validator = require('../utils/validation');

/**
 *
 * @param {request the data} req
 * @param {handle responds} res
 * @param {continue to the next step} next
 */
const store = async (req, res, next) => {
  validator(req.body, {
    name: 'required',
    description: 'required',
  });
  next();
};

/**
 *
 * @param {request the data} req
 * @param {handle responds} res
 * @param {continue to the next step} next
 */
const update = async (req, res, next) => {
  validator(req.body, {
    name: 'required',
    description: 'required',
    isDeleted: 'required',
  });
  next();
};

module.exports = {
  store,
  update,
};
