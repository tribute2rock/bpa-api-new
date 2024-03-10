const { Op } = require('sequelize');
const { Trigger, Action } = require('../models');
const { getQuery } = require('../sql/returnUsers');
const connection = require('../config/database');
const { actionName } = require('../constants/request');
const db = require('../config/database');

const allTriggers = () => {
  return Trigger.findAll();
};

const allActions = async (data) => {
  if (data.isApprover === 'false') {
    return Action.findAll({ where: { name: { [Op.ne]: actionName.Approve } } });
  }
  return Action.findAll({ where: { name: { [Op.ne]: actionName.Forward } } });
};

const isReferredRequest = async (id, groupId) => {
  return (
    await db.query(`
  select * from workflow_logs where requestId = ${id} and actionId = 5 and nextGroupId = ${groupId}`)
  )[0][0];
};

const getReturnUsers = async (options) => {
  const referid = await isReferredRequest(options.requestId, options.groupId);
  if (referid) {
    const referGroup = referid.groupId;
    return (await db.query(`select id, name from groups where id = ${referGroup}`))[0];
  }
  const query = await getQuery(options);
  const users = await connection.query(query);
  return users[0];
};

module.exports = { allTriggers, getReturnUsers };
