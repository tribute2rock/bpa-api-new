const { categoryRepository } = require('../repositories');

/**
 * Stores a new category.
 *
 * @param data
 * @returns {Promise<void>}
 */

const store = async (data) => {
  return categoryRepository.store(data);
};

/**
 * Updates a category.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const update = async (id, data) => {
  return categoryRepository.update(id, data);
};

/**
 * Soft deletes a category.
 *
 * @param id
 * @param data
 * @returns {Promise<void>}
 */
const destroy = async (id, data) => {
  return categoryRepository.destroy(id, data);
};

module.exports = {
  store,
  update,
  destroy,
};
