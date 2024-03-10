const validator = require('../utils/validation');

/**
 * Validates a login request.
 * @param req
 * @param res
 * @param next
 */
const login = async (req, res, next) => {
  validator(req.body, {
    username: 'required',
    password: 'required|string|min:8|max:255',
  });
  next();
};

/**
 * Validates request to refresh access token.
 *
 * @param req
 * @param res
 * @param next
 */
const refresh = async (req, res, next) => {
  validator(req.body, {
    refreshToken: 'required',
  });
  next();
};

module.exports = {
  login,
  refresh,
};
