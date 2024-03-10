const httpStatus = require('http-status');
const { utilRepository, requestRepository } = require('../repositories');
const { respond } = require('../utils/response');
const { findUserGroup } = require('../repositories/request');

const getAllTriggers = async (req, res) => {
  await utilRepository
    .allTriggers()
    .then((triggers) => {
      respond(res, httpStatus.OK, 'Get all triggers', triggers);
    })
    .catch(() => {
      respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!');
    });
};

const getAllActions = async (req, res) => {
  await utilRepository
    .allActions(req.query)
    .then((actions) => {
      respond(res, httpStatus.OK, 'Get all actions', actions);
    })
    .catch(() => {
      respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!');
    });
};

const getReturnUsers = async (req, res) => {
  const workflowId = await requestRepository.getWorkFlowId(Number(req.query.requestId));
  const groupId = await findUserGroup(Number(req.query.requestId), Number(req.query.userId));

  const options = {
    requestId: Number(req.query.requestId),
    groupId: groupId,
    userId: Number(req.query.userId),
    workflowId: Number(workflowId),
  };
  await utilRepository
    .getReturnUsers(options)
    .then((users) => {
      respond(res, httpStatus.OK, 'Get all return users', users);
    })
    .catch(() => {
      respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error');
    });
};

module.exports = { getAllTriggers, getAllActions, getReturnUsers };
