const { Op } = require('sequelize');
const { Form, Category, Workflow, Request, PrintTemplate, PrintTemplateForm } = require('../models');
const base = require('./base');
const db = require('../config/database');
const { status } = require('../constants/request');
const Sequelize = require('sequelize');

/**
 * Gets all the forms from the database.
 *
 * @returns {Promise<Form[]>}
 */
const all = async () => {
  const forms = await db.query(`select f.id,
                                       f.name form,
                                       f.requireReAuth,
                                       f.TACtype,
                                       f.TAC,
                                       f.formFees,
                                       f.availableFor,
                                       w.name workflow,
                                       f.type,
                                       f.availableFor,
                                       c.name category,
                                       f.isActive,
                                       f.flowCount,
                                       f.isDeleted,
                                       f.createdAt
                                from forms f
                                       join categories c on c.id = f.categoryId
                                       join workflows w on f.workflowId = w.id`);
  return forms[0];
};

const allPaginate = (limit, offset) => {
  Form.belongsTo(Category);
  Form.belongsTo(Workflow);
  return Form.findAndCountAll({
    where: { isDeleted: false },
    limit,
    offset,
    include: [
      {
        model: Category,
        attributes: ['id', 'name'],
      },
      {
        model: Workflow,
        attributes: ['id', 'name'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * handle search request for forms
 * @param {*} limit
 * @param {*} offset
 * @param {*} search
 * @returns
 */
const searchPaginate = (limit, offset, search) => {
  Form.belongsTo(Category);
  Form.belongsTo(Workflow);
  return Form.findAndCountAll({
    where: { isDeleted: false, name: { [Op.substring]: search } },
    limit,
    offset,
    include: [
      {
        model: Category,
        attributes: ['id', 'name'],
      },
      {
        model: Workflow,
        attributes: ['id', 'name'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Finds and gets a specific form.
 *
 * @param needle
 * @param column
 */
const find = async (needle, column = 'id') => {
  Form.belongsTo(Category);
  Form.belongsTo(Workflow);
  Form.belongsToMany(PrintTemplate, {
    through: 'print_temp_forms',
    foreignKey: 'formId',
  });
  Form.hasMany(Request, {
    sourceKey: 'id',
    foreignKey: 'formId',
  });
  const forms = await Form.findOne({
    where: { id: needle, isDeleted: false },
    attributes: [
      'id',
      'name',
      'limitType',
      'limitValues',
      'description',
      'type',
      'formFees',
      'availableFor',
      'TAC',
      'TACtype',
      'requireReAuth',
      'formData',
      'css',
      'javascript',
      'createdAt',
      'formCategory',
      'flowCount',
      'enableBranchSeperation',
      'enableFormEdit',
      'enableReSubmit',
      'enablePreview',
      'ccmsUrl'
      // [db.Sequelize.fn("COUNT", db.Sequelize.col("requests.formId")), "n_formId"],
    ],
    include: [
      {
        model: Category,
        required: true,
        attributes: ['id', 'name'],
      },
      {
        model: Workflow,
        required: true,
        attributes: ['id', 'name'],
      },
      {
        model: PrintTemplate,
        as: 'print_temps',
        required: false,
        attributes: ['id', 'name'],
      },
      {
        model: Request,
        required: false,
        attributes: ['id', 'formId'],
        // where:{
        // statusId:4|| null
        //       }
      },
    ],
  });
  return forms;
  // return base.find(Form, needle, column);
};

/**
 * Counts the number of forms.
 *
 * @returns {Promise<{rows: Form[], count: number}>}
 */
const count = async () => {
  const c = await Form.findAndCountAll();
  return c.count;
};

/**
 * Stores a new form into the database.
 *
 * @param data
 * @returns {data}
 */
const store = (data) => {
  return Form.create(data);
};

/**
 * Updates a specific form.
 *
 * @param id
 * @param data
 * @returns {*}
 */
const update = (id, data) => {
  return Form.update(data, { where: { id } });
};

/**
 * Soft deletes a specific form.
 * @param id
 * @returns {*}
 */
const destroy = (id) => {
  return Form.update({ isDeleted: true }, { where: { id } });
};

/**
 * Find the total number of forms that have no completed request.
 * @param id
 * @returns {Promise<{rows: Model[], count: number}>}
 */
const countActive = async (id) => {
  return Request.findAndCountAll({ where: { formId: id, statusId: { [Op.ne]: status.Completed } } });
};

module.exports = {
  all,
  allPaginate,
  searchPaginate,
  find,
  store,
  update,
  destroy,
  count,
  countActive,
};
