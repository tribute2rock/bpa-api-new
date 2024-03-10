/**
 * Gets all the data of a specific model from the database.
 *
 * @returns {Promise<model[]>}
 */
const all = (model) => {
  return model.findAll({
    where: {
      isDeleted: false,
    },
  });
};

/**
 * Finds a data of a specific model using provided column and data.
 * @param model
 * @param needle
 * @param column
 * @returns {Promise<model|null>}
 */
const find = async (model, needle, column = 'id') => {
  const filter = {};
  filter[column] = needle;
  return model.findOne({
    where: filter,
  });
};

module.exports = { find, all };
