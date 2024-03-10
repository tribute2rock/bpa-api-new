const { Op } = require('sequelize');
const connection = require('../config/database');
const { status } = require('../constants/request');
const { Workflow, WorkflowLevel, WorkflowMaster, Form, Request } = require('../models');
const { getLevelData } = require('../services/workflow');

/**
 * Get all workflow
 * @returns
 */
const all = async () => {
  return Workflow.findAll({ where: { isDeleted: false } });
};

/**
 *
 * @param limit
 * @param offset
 * @returns {Promise<{rows: Model[Workflow], count: number}>}
 */
const allPaginate = (limit, offset) => {
  return Workflow.findAndCountAll({ where: { isDeleted: false }, limit, offset, order: [['createdAt', 'DESC']] });
};

const searchPaginate = (limit, offset, search) => {
  return Workflow.findAndCountAll({
    where: { isDeleted: false, name: { [Op.substring]: search } },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Get specific workflow detail
 * @param {*} needle
 * @param {*} column
 * @returns
 */
const find = async (needle, column = 'id') => {
  const filter = {};
  filter[column] = needle;
  return Workflow.findOne({
    where: filter,
    attributes: ['id', 'name', 'description', 'workflowType'],
  }).then(async (workflow) => {
    const levels = await WorkflowLevel.findAll({
      where: { workflowId: workflow.id, isDeleted: false },
      attributes: ['groupId', 'trigger', 'isApprover', 'level', 'subformId', 'multiplePicker'],
      order: [['level', 'ASC']],
    });
    return { workflow, levels };
  });
};

/**
 * Creates a workflow and workflow level from given data.
 * @param {*} data
 * @returns
 */
const post = async (data) => {
  try {
    return await connection.transaction(async (t) => {
      return Workflow.create(data.workflow, { transaction: t }).then(async (workflow) => {
        const levels = await getLevelData(workflow.id, data.levels);
        const newLevels = await WorkflowLevel.bulkCreate(levels, { transaction: t });
        return { workflow, levels: newLevels };
      });
    });
  } catch (err) {
    throw err;
  }
};

/**
 * Edit workflow based on given id
 * @param {*} data
 * @returns
 */
const edit = async (data) => {
  try {
    return await connection.transaction(async (t) => {
      return Workflow.update(data.workflow, { where: { id: data.workflow.id }, transaction: t }).then(async () => {
        const levels = await getLevelData(data.workflow.id, data.levels);

        // const oldLevels = await WorkflowLevel.findAll({
        //   where: { workflowId: data.workflow.id },
        //   attributes: ['groupId', 'trigger', 'isApprover', 'level', 'workflowId'],
        //   order: [['level', 'ASC']],
        // });
        // const OldLevelGroupId = oldLevels.map(dta => dta.groupId)
        // const newLevelId = data.levels.map(dta => dta.groupId)
        // console.log("OLDIDS=>",OldLevelGroupId);
        // console.log("NEWIDS=>",newLevelId);
        // var dummy = [];
        // for (let i = 0; i < OldLevelGroupId.length; i++) {
        //   // console.log(newLevelId.indexOf(OldLevelGroupId[i]));
        //   if(newLevelId.indexOf(OldLevelGroupId[i])< 0){
        //     dummy.push(OldLevelGroupId[i]);
        //   }

        // }
        // console.log("FITER==>",dummy);
        // await WorkflowLevel.update({
        //   isDeleted : true,
        // },
        //   { where: {
        //     workflowId : data.workflow.id,
        //     groupId : dummy
        //   }}
        // )
        await WorkflowLevel.update({ isDeleted: true }, { where: { workflowId: data.workflow.id }, transaction: t });
        const newLevels = await WorkflowLevel.bulkCreate(levels, { transaction: t });
        return { workflow: data.workflow, levels: newLevels };
      });
    });
  } catch (err) {
    throw err;
  }
};

/**
 * Checks whether the workflow is used by another process, if true return 403 else return 200.
 * @param {*} id
 * @returns
 */
const remove = async (id) => {
  const isUsed = await WorkflowMaster.findOne({ where: { workflowId: id } });
  if (!isUsed) {
    Workflow.update({ isDeleted: true }, { where: { id } });
    return { success: true };
  }
  return { success: false };
};

/**
 * Get workflow Id from request and returns all requests that do not have completed requests.
 * @param id
 * @returns {Promise<{rows: Model[], count: number}|{count: number}>}
 */
const countActive = async (id) => {
  const form = await Form.findAll({ where: { workflowId: id } });
  if (!form) {
    return { count: 0 };
  }
  let formId = form.map((f) => f.id);
  return Request.findAndCountAll({ where: { formId: formId, statusId: { [Op.ne]: status.Completed } } });
};

module.exports = {
  find,
  all,
  allPaginate,
  post,
  edit,
  remove,
  countActive,
  searchPaginate,
};
