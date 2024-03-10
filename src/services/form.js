const { formRepository } = require('../repositories');

/**
 * Stores a new form.
 *
 * @param data
 * @returns {data}
 */
const store = (data) => {
  return formRepository.store(data);
};

/**
 * Updates a specific form.
 *
 * @param id
 * @param data
 * @returns {*}
 */
const update = (id, data) => {
  return formRepository.update(id, data);
};

/**
 * Soft deletes a specific form.
 *
 * @param id
 * @returns {*}
 */
const destroy = (id) => {
  return formRepository.destroy(id);
};

module.exports = {
  update,
  store,
  destroy,
};
