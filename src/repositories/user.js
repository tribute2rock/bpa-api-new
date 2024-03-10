const { Op } = require('sequelize');
const { User, RoleUser, Role, Group, GroupUser } = require('../models');
const roleRepository = require('./role');
const db = require('../config/database');
const ad = require('../external/ad');
const base = require('./base');
const { systemLogsQurey, difference } = require('../config/logs');
var log_query, log_schema, logs_obj, final_logs_obj, logOutput;

/**
 * Gets a user.
 *
 * @param needle
 */
const find = async (needle) => {
  const record = await User.findOne({
    where: {
      id: needle,
      isDeleted: false,
    },
  });
  if (record) {
    const user = await ad.find(record.email);
    if (user) {
      user.id = record.id;
      return user;
    }
  }
  return null;
};

//Find By EMAIL
const findByEmail = async (needle) => {
  const record = await User.findOne({
    where: {
      email: needle,
    },
  });
};

const findStatus = async (needle, column = 'id') => {
  return base.find(User, needle, column);
};

/**
 * Checks if a user exists on the database.
 *
 * @returns {boolean}
 * @param needle
 * @param column
 */
const exists = async (needle, column = 'id') => {
  const filter = {};
  filter[column] = needle;
  const count = await User.count({
    where: filter,
  });
  return count > 0;
};

/**
 * Get all users without pagination.
 *
 * @returns {Promise<*>}
 */
const all = async (searchParam = null) => {
  const query = () => {
    if (searchParam && searchParam.email) {
      return {
        email: { [Op.like]: `%${searchParam.email}%` },
        isDeleted: false,
      };
    }
    return {
      isDeleted: false,
    };
  };
  User.belongsToMany(Role, { through: RoleUser });
  const dbUsers = await User.findAll({
    where: query(),
    include: Role,
    order: [['name', 'ASC']],
  });
  const adUsers = await ad.all();
  const users = [];
  for (let i = 0; i < dbUsers.length; i += 1) {
    const user = adUsers.find((adUser) => adUser.email.toLowerCase() === dbUsers[i].email.toLowerCase());

    const newItem = {
      id: dbUsers[i].id,
      ...user,
      role: dbUsers[i].roles[0]?.name,
      isActive: dbUsers[i].isActive,
      isDeleted: dbUsers[i].isDeleted,
    };
    users.push(newItem);
  }
  return users;
};

/**
 *  Get all users
 * @returns
 */
const allPaginate = async (limit, offset, searchParam) => {
  const searchParams = searchParam ? JSON.parse(searchParam) : '';
  const searchString = searchParams.email || '';
  const { filterData } = searchParams;

  const users = [];
  const allStaffs = await ad.all();

  User.belongsToMany(Role, { through: RoleUser, where: { isDeleted: false } });
  const result = await User.findAndCountAll({
    where: { isDeleted: false, ...filterData, email: { [Op.like]: `%${searchString}%` } },
    limit,
    offset,
    include: [
      {
        model: Role,
        attributes: ['name'],
      },
    ],
    distinct: true,
  });
  const dbUsers = result.rows;
  if (dbUsers && dbUsers.length > 0) {
    dbUsers.forEach((dbUser) => {
      const userData = allStaffs.find((item) => {
        return item.email.toLowerCase() === dbUser.email.toLowerCase();
      });
      if (userData) {
        userData.role = dbUser.roles[0]?.name ? dbUser.roles[0].name : '';
        userData.id = dbUser.id ? dbUser.id : '';
        userData.isActive = dbUser.isActive ? dbUser.isActive : '';
        userData.createdAt = dbUser.createdAt ? dbUser.createdAt : '';
        users.push(userData);
      }
    });
  }
  return {
    count: result.count,
    rows: users,
  };
};

const searchPaginate = async (limit, offset, search, searchParam) => {
  // code might be needed for filter search
  // const searchParams = search ? JSON.parse(search) : '';
  // const searchString = searchParams.email || '';
  // const { filterData } = searchParams;

  const users = [];
  const allStaffs = await ad.all();

  User.belongsToMany(Role, { through: RoleUser });
  const result = await User.findAndCountAll({
    where: { isDeleted: false, email: { [Op.substring]: search } },
    limit,
    offset,
    include: [
      {
        model: Role,
        attributes: ['name'],
      },
    ],
  });
  const dbUsers = result.rows;
  if (dbUsers && dbUsers.length > 0) {
    dbUsers.forEach((dbUser) => {
      const userData = allStaffs.find((item) => {
        return item.email.toLowerCase() === dbUser.email.toLowerCase();
      });
      if (userData) {
        userData.role = dbUser.roles[0]?.name ? dbUser.roles[0].name : '';
        userData.id = dbUser.id ? dbUser.id : '';
        userData.isActive = dbUser.isActive ? dbUser.isActive : '';
        userData.createdAt = dbUser.createdAt ? dbUser.createdAt : '';
        users.push(userData);
      }
    });
  }
  return {
    count: result.count,
    rows: users,
  };
};

/**
 * Store a new user into the application.
 *
 * this store code stores and created automatic group for user also
 * this store code also checks existing user and recreate those user accordingly
 * @param {*} data
 * @returns
 */
const store = async (data, logs_data) => {
  const userData = await User.findOne({ where: { isDeleted: true, email: data.email } });
  if (userData) {
    const t = await db.transaction();
    try {
      const updateData = { isDeleted: false };
      const updateUser = await User.update(
        updateData,
        {
          logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)),
          where: { email: data.email },
        },
        { transaction: t }
      );
      let modelName = log_schema.model;
      logs_obj = {
        queryExecute: log_query,
        queryType: log_schema?.type,
        model: modelName?.name,
      };
      final_logs_obj = { ...logs_data, ...logs_obj };
      logOutput = await systemLogsQurey(final_logs_obj);
      if (!logOutput) return false;
      await RoleUser.create(
        {
          roleId: data.roleId,
          userId: userData.id,
        },
        { transaction: t }
      );

      const groupId = (
        await db.query(
          `select groups.id from group_users join groups on groups.id = group_users.groupId where userId = ${userData.id} and groups.groupType = 'automatic'`
        )
      )[0][0];
      await Group.update(updateData, { where: { id: groupId.id, groupType: 'automatic' } }, { transaction: t });
      await GroupUser.update(updateData, { where: { userId: userData.id } }, { transaction: t });
      // return respond(res, httpStatus.CREATED, 'User created sucessfully', updateUser);
      await t.commit();
      return updateUser;
    } catch (e) {
      console.log('Error creating user');
      await t.rollback();
    }
  } else {
    const t = await db.transaction();
    try {
      const user = await User.create(
        data,
        { logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)) },
        { transaction: t }
      );
      let modelName = log_schema.model;
      logs_obj = {
        queryExecute: log_query,
        queryType: log_schema?.type,
        model: modelName?.name,
      };
      final_logs_obj = { ...logs_data, ...logs_obj };
      logOutput = await systemLogsQurey(final_logs_obj);
      if (!logOutput) return false;
      await RoleUser.create(
        {
          roleId: data.roleId,
          userId: user.id,
        },
        { transaction: t }
      );
      const groupName = data.name;
      const group = await Group.create(
        {
          name: data.name,
          description: `${groupName} Automatic Group`,
          groupType: 'automatic',
        },
        { transaction: t }
      );
      await GroupUser.create(
        {
          groupId: group.id,
          userId: user.id,
        },
        { transaction: t }
      );
      await t.commit();
      return user;
    } catch (e) {
      console.log('Error creating user');
      await t.callback();
    }
  }
};

/**
 * Edit user based on given id
 * @param id
 * @param {*} data
 * @returns
 */
const update = async (id, data, logs_data) => {
  await User.update(
    { solID: data.solID },
    {
      logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)),
      where: { id },
    }
  );
  let modelName = log_schema.model;
  logs_obj = {
    queryExecute: log_query,
    queryType: log_schema?.type,
    model: modelName?.name,
  };
  final_logs_obj = { ...logs_data, ...logs_obj };
  logOutput = await systemLogsQurey(final_logs_obj);
  if (!logOutput) return false;
  await RoleUser.destroy({ where: { userId: id } });
  await RoleUser.create({ roleId: data.roleId, userId: id });
  return true;
};

const updateStatus = (id, data) => {
  return User.update(data, { where: { id } });
};

/**
 * Soft deletes a user based on provided id
 * @returns
 * @param id
 */
const destroy = async (id, logs_data) => {
  const t = await db.transaction();
  try {
    const user = await User.update(
      { isDeleted: true },
      {
        logging: async (sql, schema) => await ((log_query = sql), (log_schema = schema)),
        where: { id },
      },
      { transaction: t }
    );
    let modelName = log_schema.model;
    logs_obj = {
      queryExecute: log_query,
      queryType: log_schema?.type,
      model: modelName?.name,
    };
    final_logs_obj = { ...logs_data, ...logs_obj };
    logOutput = await systemLogsQurey(final_logs_obj);
    if (!logOutput) return false;
    const groupId = (
      await db.query(
        `select groups.id from group_users join groups on groups.id = group_users.groupId where userId = ${id} and groups.groupType = 'automatic'`
      )
    )[0][0];
    await RoleUser.update({ isDeleted: true }, { where: { userId: id } }, { transaction: t });
    await GroupUser.update({ isDeleted: true }, { where: { userId: id } }, { transaction: t });
    await Group.update({ isDeleted: true }, { where: { id: groupId.id, groupType: 'automatic' } }, { transaction: t });

    await t.commit();
    return user;
  } catch (e) {
    await t.rollback();
  }
};

/**
 * Get a specific user information.
 *
 * @param id
 */
const single = async (id) => {
  const user = await find(id);
  const roleUser = await RoleUser.findOne({
    where: {
      userId: user.id,
      isDeleted: false,
    },
  });
  const role = await roleRepository.find(roleUser.roleId);
  // user.role = role[0];
  return {
    ...user,
    role,
  };
};

const tokenData = async (id, handleToken) => {
  const user = await find(id);
  const userSol = user.solId || '';
  const roleUser = await RoleUser.findOne({
    where: {
      userId: user.id,
      isDeleted: false,
    },
  });
  const role = await roleRepository.find(roleUser.roleId);
  const permissions = (
    await db.query(`select name from permissions where id in (select permissionId from role_permissions where roleId
    in (select role_users.roleId from role_users where userId = ${user.id} )
)`)
  )[0];
  user.roleId = role.id;
  user.role = role.name;
  user.permissions = [];
  permissions.map((p) => {
    return user.permissions.push(p.name);
  });
  if (handleToken) {
    user.branchSol = userSol;
  }
  return user;
};

module.exports = {
  find,
  findStatus,
  exists,
  allPaginate,
  store,
  update,
  updateStatus,
  destroy,
  single,
  tokenData,
  all,
  searchPaginate,
};
