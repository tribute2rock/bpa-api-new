const { branchRepository } = require('../repositories');
/**
 * Stores a new group.
 *
 * @param data
 * @returns {Promise<void>}
 */

const store = async (data) => {
  return branchRepository.store(data);
};

/**
 * Updates a group.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const update = async (id, data) => {
  return branchRepository.update(id, data);
};

/**
 * Soft deletes a group.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const destroy = async (id, data) => {
  return branchRepository.destroy(id, data);
};

module.exports = {
  store,
  update,
  destroy,
};
