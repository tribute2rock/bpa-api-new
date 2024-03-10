const { Permission } = require('../models');

/**
 * Gets all the permissions from the database.
 *
 * @returns {*}
 */
const all = () => {
  return Permission.findAll();
};

/**
 * Gets all the permissions from the database
 * and group them
 */
const grouped = async () => {
  const permissions = await Permission.findAll();
  let grouped = {};
  permissions.forEach((obj) => {
    const { group } = obj;
    if (!grouped.hasOwnProperty(group)) {
      grouped[group] = [];
    }
    grouped[group].push(obj);
  });
  return grouped;
};

module.exports = {
  all,
  grouped,
};
