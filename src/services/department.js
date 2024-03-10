const { departmentRepository } = require('../repositories');

/**
 * Stores a new department.
 *
 * @param data
 * @returns {Promise<void>}
 */

const store = async (data) => {
  return departmentRepository.store(data);
};

/**
 * Updates a department.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const update = async (id, data) => {
  return departmentRepository.update(id, data);
};

/**
 * Soft deletes a department.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const destroy = async (id, data) => {
  return departmentRepository.destroy(id, data);
};

module.exports = {
  store,
  update,
  destroy,
};
