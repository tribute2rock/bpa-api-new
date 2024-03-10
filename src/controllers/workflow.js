const httpStatus = require('http-status');
const logger = require('../config/logger');
const { getPagingData, getPagination } = require('../utils/pagination');
const { workflowRepository, userRepository } = require('../repositories');
const { respond } = require('../utils/response');

/**
 * Get all workflow from database
 * @param {*} req
 * @param {*} res
 */
const all = async (req, res) => {
  let workflowList;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let workflow;
    if (req.query?.search) {
      const search = req.query.search;
      workflow = await workflowRepository.searchPaginate(limit, offset, search);
    } else {
      workflow = await workflowRepository.allPaginate(limit, offset);
    }
    workflowList = getPagingData(workflow, page, limit, offset);
  } else {
    workflowList = await workflowRepository.all();
  }
  return respond(res, httpStatus.OK, null, workflowList);
};

/**
 * Get specified workflow detail.
 * @param {*} req
 * @param {*} res
 */
const single = async (req, res) => {
  await workflowRepository
    .find(req.params.id)
    .then((workflow) => {
      respond(res, httpStatus.OK, 'Get workflow', workflow);
    })
    .catch((err) => {
      logger.error(err);
      respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!');
    });
};

/**
 * Store workflow detail
 * @param {*} req
 * @param {*} res
 */
const store = async (req, res) => {
  const workflowData = { workflow: req.body.workflow, levels: req.body.workflow_users };
  await workflowRepository
    .post(workflowData)
    .then((data) => {
      respond(res, httpStatus.OK, 'Create workflow', data);
    })
    .catch((err) => {
      logger.error(err);
      respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!');
    });
};

/**
 * Update the specified workflow  according to given id.
 * @param {*} req
 * @param {*} res
 */
const update = async (req, res) => {
  const workflow = {
    id: Number(req.body.workflow.id),
    name: req.body.workflow.name,
    description: req.body.workflow.description,
  };
  if (!workflow.name) {
    delete workflow.name;
  }
  if (!workflow.description) {
    delete workflow.description;
  }
  const workflowData = { workflow, levels: req.body.workflow_users };
  await workflowRepository
    .edit(workflowData)
    .then((aa) => {
      respond(res, httpStatus.OK, 'Workflow updated successfully.', aa);
    })
    .catch((err) => {
      logger.error(err);
      respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!.');
    });
};

/**
 * Deletes the specific workflow
 * @param {*} req
 * @param {*} res
 */
const destroy = async (req, res) => {
  await workflowRepository
    .remove(req.params.id)
    .then((data) => {
      if (data.success) {
        respond(res, httpStatus.OK, 'Success in deletion');
      } else {
        respond(res, httpStatus.FORBIDDEN, 'Workflow is used by another request');
      }
    })
    .catch((err) => {
      logger.error(err);
      respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error in deletion');
    });
};

/**
 * Get workflow users.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const users = async (req, res) => {
  return respond(res, httpStatus.OK, null, await userRepository.all());
};

/**
 * Returns total number of workflow that have no completed request.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const countActive = async (req, res) => {
  const { id } = req.params;
  const workflow = await workflowRepository.countActive(id);
  respond(res, httpStatus.OK, 'Active request count', workflow.count);
};
module.exports = { all, single, store, update, destroy, users, countActive };
