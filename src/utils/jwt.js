const jwt = require('jsonwebtoken');
const { JWT } = require('../config');

/**
 * Generates JWT tokens.
 *
 * @param data
 * @param expiry
 * @returns {*}
 */
const generateToken = (data, expiry) => {
  return jwt.sign(data, JWT.SECRET, {
    expiresIn: expiry,
  });
};

/**
 * Generates an access token.
 *
 * @param data
 * @returns {*}
 */
const generateAccessToken = (data) => {
  return generateToken(data, JWT.ACCESS_TOKEN_EXPIRY);
};

/**
 * Generates an access token.
 *
 * @param data
 * @returns {*}
 */
const generateRefreshToken = (data) => {
  return generateToken(data, JWT.REFRESH_TOKEN_EXPIRY);
};

/**
 * Checks if a token is valid.
 *
 * @param token
 * @returns {{data: (*), status: boolean}}
 */
const isValidToken = (token) => {
  try {
    const data = jwt.verify(token, JWT.SECRET);
    return {
      status: true,
      data,
    };
  } catch (e) {
    return {
      status: false,
      data: null,
    };
  }
};

module.exports = { generateAccessToken, generateRefreshToken, isValidToken };
