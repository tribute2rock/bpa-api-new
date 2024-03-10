const httpStatus = require('http-status');
const { off } = require('../config/logger');
const { Branch } = require('../models');
const { branchRepository } = require('../repositories');
const { branchService, groupService } = require('../services');
const { getPagination, getPagingData } = require('../utils/pagination');
const { respond } = require('../utils/response');

const all = async (req, res) => {
  let branch;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let branchData;
    if (req.query?.search) {
      const search = req.query.search;
      branchData = await branchRepository.searchPaginate(limit, offset, search);
    } else {
      branchData = await branchRepository.allPaginate(limit, offset);
    }
    branch = getPagingData(branchData, page, limit, offset);
  } else {
    branch = await branchRepository.all();
  }
  return respond(res, httpStatus.OK, null, branch);
};

/**
 * Create a new branch.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const store = async (req, res) => {
  const solID = await Branch.findOne({ where: { isDeleted: false, sol: req.body.sol } });
  if (solID) {
    respond(res, httpStatus.PRECONDITION_FAILED, 'Branch code already exists.');
  } else {
    const branch = await branchService.store({
      name: req.body.name,
      sol: req.body.sol,
      lc_decentralized: req.body.lc_decentralized,
      bg_decentralized: req.body.bg_decentralized,
      bg_type: req.body.bg_type,
    });
    respond(res, httpStatus.CREATED, 'New branch created.', branch);
  }
};

/**
 * Gets a specific branch.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  const branch = await branchRepository.single(id);
  if (!branch) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified branch.');
  }
  respond(res, httpStatus.CREATED, null, branch);
};

/**
 * Updates a specific branch and its permissions.
 *
 * @param req
 * @param res
 */
const update = async (req, res) => {
  const { id } = req.params;
  const branch = await branchRepository.find(id);
  if (!branch) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the branch.');
  }
  const updated = await branchService.update(branch.id, {
    name: req.body.name,
    sol: req.body.sol,
    lc_decentralized: req.body.lc_decentralized,
    bg_decentralized: req.body.bg_decentralized,
    bg_type: req.body.bg_type,
  });

  if (!updated) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not update the branch.');
  }
  return respond(res, httpStatus.OK, 'Branch updated.', branch);
};

/**
 * Soft deletes a specific branch.
 *
 * @param req
 * @param res
 */
const destroy = async (req, res) => {
  const { id } = req.params;
  const group = await branchRepository.find(id);
  if (!group) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified branch.');
  }
  const deleted = await branchService.destroy(id);
  if (!deleted) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not delete the branch.');
  }
  respond(res, httpStatus.OK, 'Branch deleted.');
};

module.exports = {
  all,
  store,
  update,
  destroy,
  single,
};
