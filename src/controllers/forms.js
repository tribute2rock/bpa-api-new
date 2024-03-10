const httpStatus = require('http-status');
const { Form, PrintTemplateForm, Request, Group, FormGroup } = require('../models');
const { respond } = require('../utils/response');
const { formRepository } = require('../repositories');
const { formService } = require('../services');
const config = require('../config');
const { HTTP, Status } = require('../constants/response');
const { getPagingData, getPagination } = require('../utils/pagination');
const db = require('../config/database');
const { Op } = require('sequelize');
const { QueryTypes } = require('sequelize');
/**
 * Gets all the forms.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const all = async (req, res) => {
  let forms;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    // searching forms and paginating
    let formData;
    if (req.query?.search) {
      const search = req.query.search;
      formData = await formRepository.searchPaginate(limit, offset, search);
    } else {
      formData = await formRepository.allPaginate(limit, offset);
    }
    forms = await getPagingData(formData, page, limit, offset);
  } else {
    forms = await formRepository.all();
  }
  const totalFlowCount = await Form.sum('flowCount', {
    where: {
      isDeleted: false,
    },
  });
  forms.finalFlowCount = totalFlowCount;
  return respond(res, httpStatus.OK, null, forms);
};

/**
 * Stores a new form.
 *
 * @param {*} req
 * @param {*} res
 */
const store = async (req, res) => {
  const formName = req.body.name;
  const dynamicForm = req.body.formData;
  const htmlForm = req.body.formDataType;
  let formatedJS = req.body.js;
  if (formatedJS) {
    formatedJS = formatedJS.replace(/&lt;/g, '<');
  }
  const limit = await formRepository.count();
  if (limit <= config.CREATE_LIMIT) {
    const form = await formService.store({
      name: req.body.name,
      type: req.body.type,
      limitType: req.body.limitType,
      limitValues: req.body.limitValues,
      formFees: req.body.formFees,
      TAC: req.body.TAC,
      TACtype: req.body.TACtype,
      requireReAuth: req.body.requireReAuth,
      availableFor: req.body.availableFor,
      description: req.body.description,
      categoryId: req.body.categoryId,
      workflowId: req.body.workflowId,
      formData: req.body.formData,
      css: req.body.css,
      javascript: formatedJS,
      ccmsUrl: req.body.ccmsUrl,
      flowCount: req.body.flowCount,
      isActive: false,
      enablePreview: req.body.finalPreview,
      formCategory: req.body.categoryType,
      enableBranchSeperation: req.body.branchWiseSep,
      enableFormEdit: req.body.canFormEdit,
      enableReSubmit: req.body.canFormReSubmit,
      timelinePreview: req.body.canviewTimeline,
      // ENABLE FORM CHANGES.
    });
    // await Generator(formName, dynamicForm, htmlForm);
    const templateData = req.body.templateData;

    for (let i = 0; i < templateData.length; i++) {
      await PrintTemplateForm.create({
        printTempId: templateData[i].id,
        formId: form.id,
      });
    }

    return respond(res, httpStatus.CREATED, 'Form created successfully.', form);
  }
  return respond(res, httpStatus.FORBIDDEN, 'New forms cannot be created. Form limit reached.');
};

/**
 * Gets a specific from.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  const form = await formRepository.find(id);
  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified form.');
  }
  respond(res, httpStatus.CREATED, null, form);
};

/**
 * Can Edit a specific form.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const canEdit = async (req, res) => {
  // logic to check if form cn be edited
  const { id } = req.params;
  Form.hasMany(Request, {
    sourceKey: 'id',
    foreignKey: 'formId',
  });
  const form = await Form.findOne({
    where: {
      id: id,
    },
    attributes: ['id'],
    include: [
      {
        model: Request,
        required: false,
        attributes: ['id', 'formId'],
        where: {
          statusId: !4,
        },
      },
    ],
  });
  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not Edit specified form.');
  }
  respond(res, httpStatus.CREATED, null, form);
};
const sanitizeTemplate = (template) => {
  // let temp = template.slice(1, -1);
  let temp = template.replace(/\\n/gm, '\n');
  temp = temp.replace(/\\"/g, '"');
  return temp;
};
/**
 * Updates a specific form.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
  const { id } = req.params;
  const form = await formRepository.find(id);

  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified form.');
  }
  let formatedJS = req.body.formData.javascript;
  if (formatedJS) {
    formatedJS = formatedJS.replace(/&lt;/g, '<');
  }
  await formService.update(form.id, {
    name: req.body.formData.name,
    type: req.body.formData.type,
    availableFor: req.body.formData.availableFor,
    limitType: req.body.formData.limitType,
    limitValues: req.body.formData.limitValues,
    description: req.body.formData.description,
    categoryId: req.body.formData.categoryId,
    workflowId: req.body.formData.workflowId,
    formData: sanitizeTemplate(req.body.formData.formData),
    css: req.body.formData.css,
    javascript: formatedJS,
    formFees: req.body.formData.formFees,
    requireReAuth: req.body.formData.requireReAuth,
    TACtype: req.body.formData.TACtype,
    TAC: req.body.formData.TAC,
    formCategory: req.body.formData.formCategory,
    flowCount: req.body.formData.flowCount,
    enablePreview: req.body.formData.finalPreview,
    enableBranchSeperation: req.body.formData.branchSeperation,
    enableFormEdit: req.body.formData.formEditEnable,
    enableReSubmit: req.body.formData.formEditResubmit,
  });

  const templates = req.body.templateData;
  await PrintTemplateForm.destroy({ where: { formId: id } });
  if (templates && templates.length > 0) {
    for (let i = 0; i < templates.length; i++) {
      await PrintTemplateForm.create({ formId: id, printTempId: templates[i].id });
    }
  }

  return respond(res, httpStatus.OK, 'Form updated successfully.');
};

/**
 * Soft deletes a specific form.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const destroy = async (req, res) => {
  const { id } = req.params;
  const form = await formRepository.find(id);
  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified form.');
  }
  await formService.destroy(form.id);
  return respond(res, httpStatus.OK, 'Form deleted successfully.');
};

/**
 * Updates a specific form status.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const form = await formRepository.find(id);
  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified form.');
  }
  await formService.update(form.id, {
    isActive: req.body.isActive,
    testEnabled: false,
  });
  return respond(res, httpStatus.OK, 'Form updated successfully.');
};

/**
 * Updates a specific form status.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const updateTestEnabled = async (req, res) => {
  const { id } = req.params;
  const form = await formRepository.find(id);
  if (!form) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified form.');
  }
  await formService.update(form.id, {
    testEnabled: true,
  });
  return respond(res, httpStatus.OK, 'Form updated successfully.');
};

/**
 * Get all the forms on a Category
 */

const getFormsByCatId = async (req, res) => {
  let Id = req.params.catid;
  let FormData;
  let FormById;

  //Fetch all form data.

  try {
    FormData = await Form.findAll({
      where: {
        isDeleted: false,
        availableFor: 'internal',
      },
    });
  } catch (e) {
    res.status(HTTP.StatusInternalServerError).json({
      status: Status.Failed,
      message: 'Failed to fetch form.',
      data: null,
    });
  }

  // if no form return 404
  if (FormData === null) {
    res.status(HTTP.StatusNotFound).json({
      status: Status.Failed,
      message: 'No form was found.',
      data: null,
    });
  }

  // get the form by category id
  try {
    FormById = await Form.findAll({
      where: {
        categoryId: Id,
        isDeleted: false,
        availableFor: 'customer',
      },
    });
  } catch (e) {
    res.status(HTTP.StatusInternalServerError).json({
      status: Status.Failed,
      message: 'Failed to fetch form by id.',
      data: null,
    });
  }
  // if no form by Id return 404
  if (FormById === null) {
    res.status(HTTP.StatusNotFound).json({
      status: Status.Failed,
      message: 'Form Not found.',
      data: null,
    });
  }

  res.status(HTTP.StatusOk).json({
    status: Status.Success,
    message: 'Fetched form data.',
    data: {
      formdata: FormData,
      formid: FormById,
    },
  });
};

/**
 * Get total number of forms that have no completed request.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

const countActive = async (req, res) => {
  const { id } = req.params;
  const form = await formRepository.countActive(id);
  respond(res, httpStatus.OK, 'Active request count', form.count);
};

const cloneForm = async (req, res) => {
  const { id } = req.params;
  const form = await formRepository.find(id);

  const cloneForm = await formService.store({
    name: form.name + '_Clone',
    type: form.type,
    formFees: form.formFees,
    limitType: form.limitType,
    limitValues: form.limitValues,
    TAC: form.TAC,
    TACtype: form.TACtype,
    requireReAuth: form.requireReAuth,
    availableFor: form.availableFor,
    description: form.description,
    categoryId: form.category.id,
    workflowId: form.workflow.id,
    formData: form.formData,
    css: form.css,
    javascript: form.javascript,
  });

  const templateData = form.print_temps;
  for (let i = 0; i < templateData.length; i++) {
    await PrintTemplateForm.create({
      printTempId: templateData[i].id,
      formId: cloneForm.id,
    });
  }
  respond(res, httpStatus.OK, 'Selected form successfully cloned.', cloneForm);
};
const assignForms = async (req, res) => {
  Form.belongsToMany(Group, { through: FormGroup });
  Group.belongsToMany(Form, { through: FormGroup });
  const formId = req.body.formId;
  const groupUsers = req.body.users;

  try {
    await FormGroup.destroy({
      where: {
        formId: formId,
      },
    });
    await groupUsers.forEach(async (dta) => {
      await FormGroup.create({
        formId: formId,
        groupId: dta.id,
      });
    });
    return respond(res, 200, 'Form Assign successfull', null);
  } catch (error) {
    console.log('=== Error occured while Assigning form =====>', error);
    return respond(res, Status.Failed, 'Form Assign Unsuccessfull', null);
  }
};

const getAssignedFormUsers = async (req, res) => {
  const formId = req.params.id;
  let data;
  const query = `select distinct g.* from groups g 
	join group_forms gf on gf.groupId  = g.id and gf.formId = ${formId}
	`;
  try {
    data = await db.query(query);
    return respond(res, 200, 'Fetched users and Groups', data[0]);
  } catch (error) {
    // data.length = 0;
    console.log('====error===>', error);
    return respond(res, 404, 'Failed to get assigned Users', null);
  }
};

module.exports = {
  all,
  store,
  single,
  canEdit,
  update,
  destroy,
  updateStatus,
  countActive,
  getFormsByCatId,
  cloneForm,
  updateTestEnabled,
  assignForms,
  getAssignedFormUsers,
};
