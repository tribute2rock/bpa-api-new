const base = require('./base');
const { Group, GroupUser, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Gets all the groups from the database.
 *
 * @returns {*}
 */
const all = () => {
  return Group.findAll({ where: { isDeleted: false } });
};

const allManual = () => {
  return Group.findAll({
    where: {
      isDeleted: false,
      groupType: 'manual',
    },
  });
};

const allPaginate = (limit, offset) => {
  return Group.findAndCountAll({
    where: { isDeleted: false, groupType: 'manual' },
    limit,
    offset,
    order: [['id', 'DESC']],
  });
};
const searchPaginate = (limit, offset, search) => {
  return Group.findAndCountAll({
    where: { isDeleted: false, groupType: 'manual', name: { [Op.substring]: search } },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};
const allGroupUser = () => {
  return GroupUser.findAll({ where: { isDeleted: false } });
};

/**
 * Finds and gets a specific group.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  return base.find(Group, needle, column);
};

const findGroupUser = async (needle, column = 'id') => {
  return base.find(GroupUser, needle, column);
};

/**
 * Gets a specific group and its users.
 *
 * @returns {*}
 */
const single = async (id) => {
  const group = await Group.findOne({
    where: {
      id,
    },
  });
  GroupUser.belongsTo(Group);
  GroupUser.belongsTo(User);
  let middle = await GroupUser.findAll({
    where: {
      groupId: id,
      isDeleted: false,
    },
    attributes: ['userId'],
  });
  middle = Array.from(middle, (x) => x.userId);
  const users = await User.findAll({
    where: {
      id: middle,
    },
    attributes: ['id', 'name'],
  });
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt,
    users,
  };
};

/**
 * Stores a new group.
 *
 * @param data
 */
const store = async (data) => {
  const group = await Group.create({
    name: data.name,
    description: data.description,
    groupType: data.groupType || 'manual',
  }).then((group) => {
    data.userList.map((user) => {
      GroupUser.create({
        groupId: group.id,
        userId: user,
      });
    });
  });

  return group;
};

/**
 * Updates a specific group.
 *
 * @param id
 * @param data
 */
const update = async (id, data, logs_data) => {
  await Group.update({ name: data.name, description: data.description }, { where: { id } });
  const previousList = await GroupUser.findAll({ where: { groupId: id, isDeleted: false }, attributes: ['id', 'userId'] });

  previousList.map(async (list) => {
    if (!data.users.includes(list.userId)) {
      await GroupUser.destroy({ where: { groupId: id, userId: list.userId } });
    }
  });
  const temp = previousList.map((u) => u.userId);
  data.users.map(async (newlist) => {
    if (!temp.includes(newlist)) {
      await GroupUser.create({ groupId: id, userId: newlist });
    }
  });
  const response = { name: data.name, description: data.description, id: id };
  return response;
};

/**
 * Soft deletes a specific group.
 *
 * @param id
 * @returns {Promise<boolean>}
 */
const destroy = async (id) => {
  await Group.update({ isDeleted: true }, { where: { id } });
  await GroupUser.update({ isDeleted: true }, { where: { groupId: id } });
  return true;
};

module.exports = {
  all,
  allManual,
  allGroupUser,
  find,
  findGroupUser,
  store,
  update,
  destroy,
  single,
  allPaginate,
  searchPaginate,
};
