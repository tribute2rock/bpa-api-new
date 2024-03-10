const { users: mockUsers, provinces: mockProvinces, branches: mockBranches } = require('../mocks');
const { Branch, Province } = require('../models');

/**
 * Gets the information of a specific user from LDAP using distinguished Name.
 *
 * @param distinguishedName
 */
const user = (distinguishedName) => {
  return mockUsers.filter((u) => u.distinguishedName === distinguishedName)[0];
};

/**
 * Gets all the users from LDAP.
 *
 */
const users = () => {
  return mockUsers;
};

/**
 * Gets all the branches from Organization Unit.
 */
const branches = () => {
  return mockBranches;
};

/**
 * Gets all the provinces from Organization Unit.
 */
const provinces = () => {
  return mockProvinces;
};

/**
 * Syncs branches from AD to database.
 *
 * @returns {Promise<void>}
 */
const syncBranches = async () => {
  await Branch.destroy({
    where: {},
  });
  const newBranches = mockBranches.map((item) => {
    return { name: item.name };
  });
  await Branch.bulkCreate(newBranches);
  return true;
};

/**
 * Syncs provinces from AD to database.
 *
 * @returns {Promise<void>}
 */
const syncProvinces = async () => {
  await Province.destroy({
    where: {},
  });
  const newProvinces = mockProvinces.map((item) => {
    return { name: item.name };
  });
  await Province.bulkCreate(newProvinces);
  return true;
};

module.exports = {
  user,
  users,
  branches,
  provinces,
  syncBranches,
  syncProvinces,
};
