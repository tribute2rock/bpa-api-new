const httpStatus = require('http-status');
const { SubForm } = require('../models');
const { respond } = require('../utils/response');
const { subformRepository } = require('../repositories');
const { subformService } = require('../services');
const config = require('../config');
const { HTTP, Status } = require('../constants/response');
const { getPagingData, getPagination } = require('../utils/pagination');

/**
 * Gets all the sub forms.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const all = async (req, res) => {
  let subforms;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    const formData = await subformRepository.allPaginate(limit, offset);
    subforms = getPagingData(formData, page, limit, offset);
  } else {
    subforms = await subformRepository.all();
  }
  return respond(res, httpStatus.OK, null, subforms);
};

/**
 * Stores a new sub form.
 *
 * @param {*} req
 * @param {*} res
 */
const store = async (req, res) => {
  const limit = await subformRepository.count();
  let formatedJS = req.body.js;
  if (formatedJS) {
    formatedJS = formatedJS.replace(/&lt;/g, '<');
  }
  if (limit <= config.CREATE_LIMIT) {
    const subform = await subformService.store({
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      formData: req.body.formData,
      css: req.body.css,
      javascript: formatedJS,
    });
    return respond(res, httpStatus.CREATED, 'Sub Form created successfully.', subform);
  }
  return respond(res, httpStatus.FORBIDDEN, 'New Sub forms cannot be created. Form limit reached.');
};

/**
 * Gets a specific sub from.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  const form = await subformRepository.find(id);
  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified sub form.');
  }
  respond(res, httpStatus.CREATED, null, form);
};

/**
 * Updates a specific sub form.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
  const { id } = req.params;
  const form = await subformRepository.find(id);
  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified sub form.');
  }
  let formatedJS = req.body.javascript;
  if (formatedJS) {
    formatedJS = formatedJS.replace(/&lt;/g, '<');
  }
  await subformService.update(form.id, {
    name: req.body.name,
    type: req.body.type,
    description: req.body.description,
    formData: req.body.formData,
    css: req.body.css,
    javascript: formatedJS,
  });
  return respond(res, httpStatus.OK, 'Sub Form updated successfully.');
};

/**
 * Soft deletes a specific sub form.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const destroy = async (req, res) => {
  const { id } = req.params;
  const form = await subformRepository.find(id);
  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified sub form.');
  }
  await subformService.destroy(form.id);
  return respond(res, httpStatus.OK, 'Sub Form deleted successfully.');
};

module.exports = {
  all,
  store,
  single,
  update,
  destroy,
};
