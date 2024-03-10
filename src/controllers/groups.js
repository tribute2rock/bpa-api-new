const httpStatus = require('http-status');
const { groupRepository } = require('../repositories');
const { groupService } = require('../services');
const { respond } = require('../utils/response');
const { Group, GroupUser, User } = require('../models');
const { HTTP, Status } = require('../constants/response');
const { getPagingData, getPagination } = require('../utils/pagination');

const all = async (req, res) => {
  const groups = await groupRepository.all();
  return respond(res, httpStatus.OK, null, groups);
};

const allManual = async (req, res) => {
  let group;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let groupData;
    if (req.query?.search) {
      const search = req.query.search;
      groupData = await groupRepository.searchPaginate(limit, offset, search);
    } else {
      groupData = await groupRepository.allPaginate(limit, offset);
    }
    group = getPagingData(groupData, page, limit, offset);
  } else {
    group = await groupRepository.allManual();
  }
  return respond(res, httpStatus.OK, null, group);
};

/**
 * Create a new group.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const store = async (req, res) => {
  const groupName = await Group.findOne({ where: { isDeleted: false, name: req.body.name } });
  let logs_data = req.log;
  if (groupName) {
    respond(res, httpStatus.PRECONDITION_FAILED, 'Group already exists.');
  } else {
    const group = await groupService.store(
      {
        name: req.body.name,
        description: req.body.description,
        groupType: req.body.groupType,
        userList: req.body.users,
      },
      logs_data
    );
    respond(res, httpStatus.CREATED, 'New group created successfully.', group);
  }
};

/**
 * Gets a specific group.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  const group = await groupRepository.single(id);
  if (!group) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified group.');
  }
  respond(res, httpStatus.CREATED, null, group);
};

/**
 * Updates a specific group and its permissions.
 *
 * @param req
 * @param res
 */
const update = async (req, res) => {
  const { id } = req.params;
  let logs_data = req.log;
  const group = await groupRepository.find(id);
  if (!group) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified group.');
  }
  const updated = await groupService.update(
    group.id,
    {
      name: req.body.name,
      description: req.body.description,
      users: req.body.users,
    },
    logs_data
  );
  if (!updated) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not update the group.');
  }
  return respond(res, httpStatus.OK, 'Group updated successfully.', group);
};

/**
 * Soft deletes a specific group.
 *
 * @param req
 * @param res
 */
const destroy = async (req, res) => {
  const { id } = req.params;
  const group = await groupRepository.find(id);
  if (!group) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified group.');
  }
  const deleted = await groupService.destroy(id);
  if (!deleted) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not delete the group.');
  }
  return respond(res, httpStatus.OK, 'Group deleted successfully.');
};

module.exports = {
  all,
  allManual,
  store,
  update,
  destroy,
  single,
};
