const httpStatus = require('http-status');
const { respond } = require('../utils/response');
const { userService } = require('../services');
const { userRepository } = require('../repositories');
const { LDAP } = require('../config');

/**
 * Authenticates a user into the application. Sends access token &
 * refresh token if the provided username and password is valid. Else
 * sends a 401.
 *
 * @param {*} req
 * @param {*} res
 */
const login = async (req, res) => {
  const { username, password } = req.body;
  const authenticated = await userService.authenticate(username, password);
  if (!authenticated) {
    return respond(res, httpStatus.UNAUTHORIZED, 'Username or password is invalid');
  }
  const user = await userRepository.find(authenticated.id);
  const tokens = await userService.generateTokens(user.id);
  return respond(res, httpStatus.OK, 'User authenticated successfully.', tokens);
};

/**
 * Refreshes the tokens of a user.
 *
 * @param {*} req
 * @param {*} res
 */
const refresh = async (req, res) => {
  const { refreshToken: token } = req.body;
  const { status, tokens } = await userService.refreshToken(token);
  if (!status) {
    return respond(res, httpStatus.UNAUTHORIZED, 'Refresh token is invalid.');
  }
  return respond(res, httpStatus.OK, 'New tokens generated successfully.', tokens);
};

module.exports = {
  login,
  refresh,
};
