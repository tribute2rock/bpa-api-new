const { userRepository } = require('../repositories');
const ad = require('../external/ad');
const jwt = require('../utils/jwt');
const { User } = require('../models');
/**
 * Authenticates a user based on the provided email and password
 * @param username
 * @param password
 * @returns {boolean}
 */
// eslint-disable-next-line no-unused-vars
const authenticate = async (username, password) => {
  const response = await ad.authenticate(username, password);

  if (response.status) {
    const user = await User.findOne({
      where: {
        email: response.data.email,
        isActive: true,
        isDeleted: false,
      },
    });
    return user || false;
  }
  return false;
};

/**
 * Generates access token and refresh token for a user.
 *
 * @param id
 * @returns {{accessToken: (*), refreshToken: (*)}}
 */
const generateTokens = async (id, handleToken) => {
  const user = await userRepository.tokenData(id, handleToken);
  return {
    accessToken: jwt.generateAccessToken(user),
    refreshToken: jwt.generateRefreshToken({ id }),
  };
};

/**
 * Refreshes a token for a user.
 *
 * @param token
 * @returns {{tokens: null, status: boolean}|{tokens: {accessToken: *, refreshToken: *}, status: boolean}}
 */
const refreshToken = async (token) => {
  const { status: valid, data } = jwt.isValidToken(token);
  if (!valid) {
    return { status: false, tokens: null };
  }
  const { id } = data;
  const user = await userRepository.exists(id);
  if (!user) {
    return { status: false, tokens: null };
  }
  return {
    status: true,
    tokens: await generateTokens(id),
  };
};

/**
 * Creates a new user.
 * @param data
 * @returns {Promise<*>}
 */
const store = async (data, logs_data) => {
  const userInfo = await ad.find(data.email);
  return userRepository.store(
    {
      ...data,
      email: userInfo.email,
      name: userInfo.name,
    },
    logs_data
  );
};

/**
 * Updates the information of the specific user.
 *
 * @param id
 * @param data
 * @returns {Promise<*>}
 */
const update = async (id, data, logs_data) => {
  return userRepository.update(id, data, logs_data);
};

const updateStatus = (id, data) => {
  return userRepository.updateStatus(id, data);
};

/**
 * Deletes a specific user.
 *
 * @param id
 * @returns {Promise<*>}
 */
const destroy = async (id, logs_data) => {
  return userRepository.destroy(id, logs_data);
};

module.exports = {
  authenticate,
  generateTokens,
  refreshToken,
  store,
  update,
  updateStatus,
  destroy,
};
