const { groupRepository } = require('../repositories');

/**
 * Stores a new group.
 *
 * @param data
 * @returns {Promise<void>}
 */

const store = async (data, logs_data) => {
  return groupRepository.store(data, logs_data);
};

/**
 * Updates a group.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const update = async (id, data, logs_data) => {
  return groupRepository.update(id, data, logs_data);
};

/**
 * Soft deletes a group.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const destroy = async (id) => {
  return groupRepository.destroy(id);
};

module.exports = {
  store,
  update,
  destroy,
};
