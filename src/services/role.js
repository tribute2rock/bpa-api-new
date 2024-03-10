const { roleRepository } = require('../repositories');

/**
 * Stores a new role.
 *
 * @param data
 * @returns {Promise<void>}
 */

const store = async (data, logs_data) => {
  return roleRepository.store(data, logs_data);
};

/**
 * Updates a role.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const update = async (id, data, logs_data) => {
  return roleRepository.update(id, data, logs_data);
};

/**
 * Soft deletes a role.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const destroy = async (id, logs_data) => {
  return roleRepository.destroy(id, logs_data);
};

module.exports = {
  store,
  update,
  destroy,
};
