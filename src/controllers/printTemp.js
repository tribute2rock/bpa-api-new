const httpStatus = require('http-status');
const { PrintTemplate, PrintTemplateForm, Form, Status } = require('../models');
const { respond } = require('../utils/response');
const { printRepository } = require('../repositories');
const { formService } = require('../services');
const config = require('../config');
const { HTTP } = require('../constants/response');
const { getPagination, getPagingData } = require('../utils/pagination');

/**
 * Gets all the templates.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const all = async (req, res) => {
  let printTemplate;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let printTemplateData;
    if (req.query?.search) {
      const search = req.query.search;
      printTemplateData = await printRepository.searchPaginate(limit, offset, search);
    } else {
      printTemplateData = await printRepository.allPaginate(limit, offset);
    }
    printTemplate = await getPagingData(printTemplateData, page, limit, offset);
  } else {
    printTemplate = await printRepository.all();
  }
  return respond(res, httpStatus.OK, null, printTemplate);
};

/**
 * Stores a new print template.
 *
 * @param {*} req
 * @param {*} res
 */
const store = async (req, res) => {
  let body = req.body.fields;
  if (body) {
    body = body.replace(/&lt;/g, '<').replace(/\\n/g, ' ').replace(/\\/g, '');
  }
  const template = await printRepository.store({
    name: req.body.name,
    type: req.body.type,
    fields: body,
    customerAccess: req.body.customerAccess,
    output: req.body.output,
  });
  respond(res, httpStatus.CREATED, 'New Templated created.', template);
};

const AllPrintTemplateForm = async (req, res) => {
  let ptForm;
  let message;

  try {
    PrintTemplateForm.belongsTo(PrintTemplate);
    PrintTemplateForm.belongsTo(Form);
    ptForm = await PrintTemplateForm.findAll({
      where: {
        isDeleted: false,
      },
      attributes: ['id', 'printTempId', 'formId', 'createdAt'],
      include: [
        {
          model: PrintTemplate,
          required: true,
          attributes: ['id', 'customerAccess', 'name', 'fields', 'output'],
        },
        {
          model: Form,
          required: true,
          attributes: [
            'id',
            'isActive',
            'isDeleted',
            'formFees',
            'TACtype',
            'TAC',
            'requireReAuth',
            'type',
            'workflowId',
            'categoryId',
            'name',
            'description',
            'tag',
            'formData',
            'css',
            'javascript',
            'availableFor',
          ],
        },
      ],
      order: [['id', 'ASC']],
    });
  } catch (e) {
    res.status(HTTP.StatusInternalServerError).json({
      status: Status.Failed,
      message: 'Failed to fetch your Request.',
      data: null,
    });
  }

  if (ptForm !== null) {
    message = 'Data fetched';
  } else {
    message = 'No datafound';
  }
  res.status(HTTP.StatusOk).json({
    status: Status.Success,
    message: message,
    data: ptForm || null,
  });
};

/**
 * Gets a specific template.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  const template = await printRepository.find(id);
  if (!template) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified print template.');
  }
  respond(res, httpStatus.CREATED, null, template);
};

/**
 * Updates a template.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
  const { id } = req.params;
  const template = await printRepository.find(id);
  if (!template) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified print template.');
  }

  let body = req.body.printTemplate.fields;
  if (body) {
    body = body.replace(/&lt;/g, '<').replace(/\\n/g, ' ').replace(/\\/g, '');
  }
  await printRepository.update(template.id, {
    name: req.body.printTemplate.name,
    type: req.body.printTemplate.type,
    fields: body,
    customerAccess: req.body.printTemplate.customerAccess,
    output: req.body.printTemplate.output,
  });
  return respond(res, httpStatus.OK, 'Template updated successfully.');
};

/**
 * Soft deletes a template.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const destroy = async (req, res) => {
  const { id } = req.params;
  const template = await printRepository.find(id);
  if (!template) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified print template.');
  }
  await printRepository.destroy(template.id);
  return respond(res, httpStatus.OK, 'Template deleted successfully.');
};

module.exports = {
  all,
  store,
  single,
  update,
  destroy,
  AllPrintTemplateForm,
};
