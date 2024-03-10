const { readFileSync } = require('fs');
const { resolve } = require('path');
const moment = require('moment');
const { Op } = require('sequelize');
const { collapseTextChangeRangesAcrossMultipleVersions } = require('typescript');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const {
  Action,
  Request,
  RequestValue,
  RoleUser,
  WorkflowMaster,
  WorkflowLog,
  Form,
  WorkflowFiles,
  SubRequest,
  SubRequestValue,
  SubForm,
  WorkflowLevel,
  Customer,
  User,
  Category,
  GroupUser,
  Workflow,
} = require('../models');
const db = require('../config/database');
const { actions, status } = require('../constants/request');
const userRepository = require('./user');
const groupRepository = require('./group');
const customerRepository = require('./customer');
const { TO_DMS } = require('../config/index');
const {
  adminRequestQuery,
  bucketRequestQuery,
  allRequestQuery,
  dashboardCount,
  internalDashboardCount,
  findAllCorporateInternalCount,
  findAllCoporateExternalCount,
} = require('../sql/requestList');
const {
  corporateRequest,
  bucketRequestQueryInternal,
  bucketRequestQueryExternal,
  allRequestQueryCorporateOne,
  allRequestQueryCorporateTwo,
} = require('../sql/corporateRequest');
const { registerCorporate } = require('../controllers/triggers');
const {
  sendRequestReturnEmail,
  sendRequestApproveEmail,
  sendRequestReturnEmailBranch,
  sendRequestApproveEmailBranch,
} = require('../channels/email/send_email');

const LC_BucketFilterForm = process.env.LC_Form;
const BG_BucketFilterForm = process.env.BG_Form;
const LC_Dec_BucketFilterForm = process.env.LC_Form_Dec;
const BG_Dec_BucketFilterForm = process.env.BG_Form_Dec;

/**
 * Get all the requests.
 *
 * @param tab
 * @param user
 * @param reqType
 * @param limit
 * @param offset
 * @returns {Promise<string>}
 */
// eslint-disable-next-line no-unused-vars
const all = async (
  tab,
  user,
  reqType,
  limit,
  offset,
  search,
  searchkey,
  startDate,
  endDate,
  uBranch,
  singleBranch,
  switchCustomer
) => {
  const roleUser = await RoleUser.findOne({
    where: {
      userId: user,
    },
  });
  if (roleUser && roleUser.roleId === 1) {
    const { query } = adminRequestQuery(reqType, offset, limit, search, searchkey, '', startDate, endDate, switchCustomer);
    return db.query(query);
  } else if (roleUser && roleUser.roleId === 3) {
    const { query } = adminRequestQuery(
      reqType,
      offset,
      '100000',
      search,
      searchkey,
      'Completed',
      startDate,
      endDate,
      switchCustomer
    );
    return db.query(query);
  }
  if (tab === 'Bucket' && (reqType == 'internal' || reqType == 'customer')) {
    const { query } = bucketRequestQuery(
      reqType,
      user,
      offset,
      limit,
      search,
      searchkey,
      startDate,
      endDate,
      uBranch,
      singleBranch
    );
    return db.query(query);
  } else if (tab === 'Bucket' && reqType == 'corporate') {
    const { query } = bucketRequestQueryInternal(
      reqType,
      user,
      offset,
      limit,
      search,
      searchkey,
      startDate,
      endDate,
      uBranch,
      singleBranch
    );
    const { query1 } = bucketRequestQueryExternal(
      reqType,
      user,
      offset,
      limit,
      search,
      searchkey,
      startDate,
      endDate,
      uBranch,
      singleBranch
    );

    const dbInternal = await db.query(query);
    const dbExternal = await db.query(query1);
    const combinedObjects = dbInternal[0].concat(dbExternal[0]);
    // Summing up the second elements of dbInternal and dbExternal
    const sum = dbInternal[1] + dbExternal[1];

    // Creating the combined array with the desired format
    const combinedArray = [combinedObjects, sum];

    return combinedArray; // Output: [[{}, {}, {}, {}], 12]
  }
  if (reqType === 'internal' || reqType === 'customer') {
    let { query } = allRequestQuery(
      reqType,
      user,
      offset,
      limit,
      search,
      searchkey,
      startDate,
      endDate,
      uBranch,
      singleBranch,
      switchCustomer
    );
    switch (tab) {
      case 'All':
        query = query.replace(/:status/g, 'All');
        break;
      case 'Upcoming':
        query = query.replace(/:status/g, 'Upcoming');
        break;
      case 'Forwarded':
        query = query.replace(/:status/g, 'Forwarded');
        break;
      case 'Approved':
        query = query.replace(/:status/g, 'Approved');
        break;
      case 'Returned':
        query = query.replace(/:status/g, 'Returned');
        break;
      case 'Closed':
        query = query.replace(/:status/g, 'Closed');
      default:
        query = query.replace(/:status/g, 'Pending');
        break;
    }
    return db.query(query);
  } else {
    let { query } = await allRequestQueryCorporateOne(
      'internal',
      user,
      offset,
      limit,
      search,
      searchkey,
      startDate,
      endDate,
      uBranch,
      singleBranch
    );
    switch (tab) {
      case 'All':
        query = query.replace(/:status/g, 'All');
        break;
      case 'Upcoming':
        query = query.replace(/:status/g, 'Upcoming');
        break;
      case 'Forwarded':
        query = query.replace(/:status/g, 'Forwarded');
        break;
      case 'Approved':
        query = query.replace(/:status/g, 'Approved');
        break;
      case 'Returned':
        query = query.replace(/:status/g, 'Returned');
        break;
      case 'Closed':
        query = query.replace(/:status/g, 'Closed');
      default:
        query = query.replace(/:status/g, 'Pending');
        break;
    }
    const internalResult = await db.query(query);
    let { query1 } = await allRequestQueryCorporateTwo(
      'external',
      user,
      offset,
      limit,
      search,
      searchkey,
      startDate,
      endDate,
      uBranch,
      singleBranch
    );
    switch (tab) {
      case 'All':
        query1 = query1.replace(/:status/g, 'All');
        break;
      case 'Upcoming':
        query1 = query1.replace(/:status/g, 'Upcoming');
        break;
      case 'Forwarded':
        query1 = query1.replace(/:status/g, 'Forwarded');
        break;
      case 'Approved':
        query1 = query1.replace(/:status/g, 'Approved');
        break;
      case 'Returned':
        query1 = query1.replace(/:status/g, 'Returned');
        break;
      case 'Closed':
        query1 = query1.replace(/:status/g, 'Closed');
      default:
        query1 = query1.replace(/:status/g, 'Pending');
        break;
    }
    const externalResult = await db.query(query1);
    const combinedResult = combineResults(internalResult, externalResult);

    return combinedResult;
  }
};

function combineResults(internalResult, externalResult) {
  const combinedResult = internalResult[0].concat(externalResult[0]);
  const sum = internalResult[1] + externalResult[1];
  return [combinedResult, sum];
}
/**
 * Gets the count of the requests according to the status of the
 * request. Currently only some status types are selected. However,
 * the status can be made to be dynamically selected.
 *
 */
const requestsCount = async (user, branch, singleBranch) => {
  // let query = readFileSync(resolve(__dirname, '../sql/dashboardRequest.sql')).toString();

  const { total } = dashboardCount(user, branch, singleBranch);
  return db.query(total);
  // query = query.replace(/\s+/g, ' ');
  // query = query.replace(/:user/g, user);
  // return await db.query(query);
};

const internalRequestsCount = async (user, branch, singleBranch) => {
  const { total } = internalDashboardCount(user, branch, singleBranch);
  return db.query(total);
};

const getCorporateInternalCount = async (user, branch, singleBranch) => {
  const { total } = findAllCorporateInternalCount(user, branch, singleBranch);
  return db.query(total);
};
const getCorporateExternalCount = async (user, branch, singleBranch) => {
  const { total } = findAllCoporateExternalCount(user, branch, singleBranch);
  return db.query(total);
};

/**
 * Request query countAll is directly copied from above method all and returns count
 * this needs to be refactor
 * @param {*} tab
 * @param {*} user
 * @param {*} reqType
 * @returns
 */
const countAll = async (
  tab,
  user,
  reqType,
  limit,
  offset,
  search,
  searchkey,
  startDate,
  endDate,
  uBranch,
  singleBranch,
  switchCustomer
) => {
  const roleUser = await RoleUser.findOne({
    where: {
      userId: user,
      roleId: 1,
    },
  });
  if (roleUser && roleUser.roleId === 1) {
    const { total } = adminRequestQuery(reqType, offset, limit, search, searchkey, '', startDate, endDate, switchCustomer);
    return db.query(total);
  } else if (roleUser && roleUser.roleId === 3) {
    const { total } = adminRequestQuery(
      reqType,
      offset,
      limit,
      search,
      searchkey,
      'Completed',
      startDate,
      endDate,
      switchCustomer
    );
    return db.query(total);
  }

  if (tab === 'Bucket') {
    let { total } = bucketRequestQuery(
      reqType,
      user,
      offset,
      limit,
      search,
      searchkey,
      startDate,
      endDate,
      uBranch,
      singleBranch
    );
    return db.query(total);
  }

  let { total } = allRequestQuery(
    reqType,
    user,
    offset,
    limit,
    search,
    searchkey,
    startDate,
    endDate,
    uBranch,
    singleBranch
  );

  switch (tab) {
    case 'All':
      total = total.replace(/:status/g, 'All');
      break;
    case 'Upcoming':
      total = total.replace(/:status/g, 'Upcoming');
      break;
    case 'Forwarded':
      total = total.replace(/:status/g, 'Forwarded');
      break;
    case 'Bucket':
      total = total.replace(/:status/g, 'Bucket');
      break;
    case 'Approved':
      total = total.replace(/:status/g, 'Approved');
      break;
    case 'Returned':
      total = total.replace(/:status/g, 'Returned');
      break;
    case 'Submitted':
      total = total.replace(/:status/g, 'Submitted');
      break;
    case 'Draft':
      total = total.replace(/:status/g, 'Draft');
      break;
    default:
      total = total.replace(/:status/g, 'Pending');
      break;
  }
  return db.query(total);
};

const checkForMultiPicker = async (requestId, groupId, userId) => {
  return (
    await db.query(`WITH logs AS (
      SELECT requestId, groupId, currentUserId, actionId, updatedAt
      FROM workflow_logs
      WHERE requestId = ${requestId} AND groupId = ${groupId} AND actionId IN (1, 3)
    ), max_updated_at AS (
      SELECT requestId, groupId, MAX(updatedAt) AS max_updated_at
      FROM workflow_logs
      WHERE requestId = ${requestId} AND actionId = 2
      GROUP BY requestId, groupId
    )
    SELECT
      CASE
          WHEN wm.multiplePicker IS NULL THEN 'true'
          WHEN wm.multiplePicker > 1 AND COUNT(l.currentUserId) < 1 THEN 'true'
          ELSE 'false'
      END AS editAvailable
    FROM
      workflow_masters wm
      LEFT JOIN logs l ON wm.requestId = l.requestId AND wm.groupId = l.groupId AND l.currentUserId = ${userId}
      LEFT JOIN max_updated_at m ON wm.requestId = m.requestId AND wm.groupId = m.groupId
    WHERE
      wm.requestId = ${requestId} AND wm.groupId = ${groupId} AND (m.max_updated_at > l.updatedAt OR m.max_updated_at IS NULL)
    GROUP BY
      wm.multiplePicker`)
  )[0][0]?.editAvailable;
  //     await db.query(`SELECT CASE
  //   WHEN (
  //     SELECT multiplePicker
  //     FROM workflow_masters wm
  //     WHERE requestId = ${requestId}
  //       AND groupId = ${groupId}
  //     ) is NULL
  //     THEN 'true'
  //   WHEN (
  //       SELECT multiplePicker
  //       FROM workflow_masters wm
  //       WHERE requestId = ${requestId}
  //         AND groupId = ${groupId}
  //       ) > 1 AND (
  //       SELECT count(*)
  //       FROM workflow_logs wl
  //       WHERE requestId = ${requestId}
  //         AND groupId = ${groupId}
  //         AND currentUserId = ${userId}
  //         AND actionId in (1, 3)
  //         AND (
  // 					wl.updatedAt > (
  // 						SELECT TOP 1 updatedAt
  // 						FROM workflow_logs wl2
  // 						WHERE wl2.requestId =  ${requestId}
  // 							AND actionId = 2
  // 						ORDER BY updatedAt DESC
  // 						)
  // 					OR NOT EXISTS (
  // 						SELECT updatedAt
  // 						FROM workflow_logs wl2
  // 						WHERE wl2.requestId = ${requestId}
  // 							AND actionId = 2
  // 						)
  // 					)
  //       ) < 1
  //     THEN 'true'
  //   ELSE 'false'
  //   END AS editAvailable
  // FROM workflow_masters wm2
  // WHERE requestId = ${requestId}
  // AND groupId = ${groupId}`)
  //   )[0][0].editAvailable;
};

const canEditTemplate = async (requestId, userId) => {
  const hasPermission = (
    await db.query(`
  SELECT DISTINCT u.* FROM users u 
    JOIN role_users ru ON u.id = ru.userId 
    JOIN role_permissions rp ON rp.roleId = ru.roleId AND rp.permissionId = 81 AND u.id = ${userId}`)
  )[0][0];
  if (hasPermission) {
    return true;
  }
  return false;
};

// Possible helper functions for request.
// is pending
// is on bucket
// is approved - final approved when all groups in the level approves
// is returned

const canEditRequest = async (requestId, userId) => {
  // if pending ma hunu paryo(wf_master ma started active and completed null)
  // request in processing state(statusId)
  // user le pick gareko xa ki xaina check
  // request should be pending

  const picker = await WorkflowLog.findOne({
    where: {
      requestId,
      currentUserId: userId,
      actionId: 4,
    },
  });

  if (picker) {
    //checking here if picker has multiplePicker in workflow master and current user has forwarded
    const res = await checkForMultiPicker(requestId, picker.groupId, userId);
    if (res == 'false') {
      return false;
    }
    // if (!picker.count === 1) {
    //   return false;
    // }
  } else {
    return false;
  }
  const { groupId } = picker;
  const workflowMasterRecord = await WorkflowMaster.findAndCountAll({
    where: {
      requestId,
      groupId,
      startedOn: {
        [Op.ne]: null,
      },
      completedOn: null,
      softApprove: null,
    },
  });

  if (workflowMasterRecord.count < 1) {
    return false;
  }

  const request = await Request.findOne({
    where: {
      id: requestId,
    },
  });
  if (request.statusId === status.Returned || request.statusId === status.Closed) {
    return false;
  }
  return !!(request.statusId === status.Processing || status.Pending);
};

/**
 * ROLLBACK CASES 
find log with current user and request and request status not (close or completed)
1 case: (if picked 0)
    if(action 4 and same requestId and updatedAt > and log.nextGroup = groupId)
2 case: (if customer forward 0)
    if(action 1 and same requestId and updatedAt > and currentUserId null)
2 case: (if already rollback 0)
    if(action 9 and same requestId and updatedAt > and currentUserId = log.currentUserId)
 */

const canRollbackRequest = async (id, user, logId) => {
  const result = (
    await db.query(`SELECT TOP 1 wl.*
    FROM workflow_logs wl
    JOIN requests r ON r.id = wl.requestId
      AND r.statusId NOT IN (4 ,6)
    WHERE wl.requestId = ${id}
      AND wl.currentUserId = ${user}
      AND wl.actionId IN (1, 2)
      AND (
        CASE 
          WHEN wl.nextGroupId = (
              SELECT TOP 1 groupId
              FROM workflow_logs wl2
              WHERE wl2.requestId = ${id}
                AND wl2.actionId = 4
                AND wl2.updatedAt > wl.updatedAt
              ORDER BY wl2.updatedAt DESC
              )
            THEN 0
          WHEN wl.nextGroupId IS NULL
            AND  (
              SELECT TOP 1 count(wl3.updatedAt)
              FROM workflow_logs wl3
              WHERE wl3.requestId = ${id}
                AND wl3.actionId = 1
                AND wl3.updatedAt > wl.updatedAt
                GROUP BY wl3.id 
              ) < 0 
            THEN 0
            WHEN wl.currentUserId = (
              SELECT TOP 1 currentUserId
              FROM workflow_logs wl4
              WHERE wl4.requestId = ${id}
                AND wl4.actionId = 9
                AND wl4.updatedAt > wl.updatedAt
                ORDER BY wl4.updatedAt DESC
              ) 
            THEN 0
          ELSE 1
          END
        ) = 1
    ORDER BY wl.updatedAt DESC`)
  )[0][0];
  if (result && result.id == logId) {
    return true;
  } else {
    return false;
  }
};

const getLevels = async (requestId) => {
  let query = readFileSync(resolve(__dirname, '../sql/levels.sql')).toString();
  query = query.replace(/\s+/g, ' ');
  query = query.replace(/:request/g, requestId);
  const data = await db.query(query);
  return data[0];
};

const canTriggerRequest = async (id, user) => {
  const result = (
    await db.query(`select count(wl.id) as triggers from workflow_levels wl 
    join workflows w on w.id = wl.workflowId 
    join forms f on f.workflowId = w.id
    join requests r on r.formId = f.id and r.id = ${id}
    where wl.[trigger] is not null`)
  )[0][0];
  if (result.triggers > 0) {
    return true;
  } else {
    return false;
  }
};

const single = async (id, userId, uBranch, singleBranch) => {
  /**
   * Get a specific request.
   *
   * @param id
   * @returns {Promise<{createdAt: *, timeline: [{files: [string], comment: string, title: string, timestamp: string}, {files: [], comment: string, title: string, timestamp: string}], id: *, fields: *, key: *}>}
   */
  let request = await Request.findOne({ where: { id } });
  let req;
  if (request && request.requestSenderType == 'user') {
    Request.hasOne(User, { sourceKey: 'requestSenderId', foreignKey: 'id' });
    req = await Request.findOne({
      where: {
        id,
      },
      include: {
        model: User,
        attributes: ['email', 'name'],
      },
    });
  } else {
    Request.hasOne(Customer, { sourceKey: 'requestSenderId', foreignKey: 'id' });
    req = await Request.findOne({
      where: {
        id,
      },
      include: {
        model: Customer,
        required: true,
        attributes: ['accountName', 'accountNumber', 'mobileNumber'],
      },
    });
  }

  // Finding sub request value
  const subrequest = await SubRequest.findOne({
    where: { requestId: id },
    order: [['updatedAt', 'DESC']],
  });
  let subform;
  if (subrequest) {
    subform = await SubForm.findOne({ where: { id: subrequest.subFormId } });
  }

  //Sub request value (for user wise updates)
  SubRequest.hasMany(SubRequestValue, { sourceKey: 'id', foreignKey: 'subRequestId' });
  const allSubRequest = await SubRequest.findAll({
    where: { requestId: id },
    attributes: ['senderId'],
    order: [['updatedAt', 'DESC']],
    include: {
      model: SubRequestValue,
      attributes: ['name', 'label', 'value', 'type'],
    },
  });

  Form.hasOne(Category, { sourceKey: 'categoryId', foreignKey: 'id' });
  Form.hasOne(Workflow, { sourceKey: 'workflowId', foreignKey: 'id' });
  const form = await Form.findOne({
    where: { id: request.formId },
    include: [
      {
        model: Category,
        attributes: ['name'],
      },
      {
        model: Workflow,
        attributes: ['workflowType'],
      },
    ],
  });
  const requestValues = await RequestValue.findAll({
    where: {
      requestId: id,
    },
  });

  Request.hasMany(WorkflowLog, {
    sourceKey: 'id',
    foreignKey: 'requestId',
  });
  WorkflowLog.hasMany(WorkflowFiles, {
    sourceKey: 'id',
    foreignKey: 'workflowLogId',
  });
  const allLogs = await Request.findOne({
    where: {
      id,
      isDeleted: false,
    },
    attributes: ['id'],
    include: [
      {
        model: WorkflowLog,
        include: [WorkflowFiles],
        attributes: ['id', 'comment', 'requestId', 'groupId', 'nextGroupId', 'currentUserId', 'actionId', 'createdAt'],
        required: false,
      },
    ],
  });
  const logs = allLogs.workflow_logs;
  const timeline = [];
  // If the nextUserId is null, it is known to be returned to a customer.
  // If the currentUserId is null, it is known to be forwarded from a customer.
  // Now the customer needs to be replaced with internal user.
  // Since only the name of the request maker is used to display on the log titles.
  // only the name of the request sender is to be extracted.

  const sender = {
    name: 'Some Name',
  };

  if (request.requestSenderType === 'user') {
    const user = await User.findOne({ where: { isDeleted: false, id: request.requestSenderId } });
    // const user = await userRepository.find(request.requestSenderId); // TODO: CHANGE
    sender.name = user?.name;
  } else if (request.requestSenderType === 'customer') {
    const customer = await customerRepository.find(request.requestSenderId);
    sender.name = customer?.accountName;
  }

  // find the sender details based on the request sender type and prepare the name
  // field. Since, customer has accountName and internal users have firstName + LastName,
  // the name field on sender has to be prepared and appended once the data has been fetched.

  for (let i = 0; i < logs.length; i++) {
    let nextUser = null;
    let nextUserName = null;
    let currentUser = null;
    let employeeCD = null;
    let branch = null;
    let department = null;
    if (logs[i].nextGroupId) {
      // eslint-disable-next-line no-await-in-loop
      nextUser = await groupRepository.find(logs[i].nextGroupId);
      nextUserName = `${nextUser.name}`;
      // console.log(nextUser);
      // employeeCD = `${nextUser.employeeCD}`;
      // branch = `${nextUser.branch}`;
      // department = `${nextUser.department}`;
    } else {
      nextUserName = `${sender.name}`;
      logs[i].isSender = true;
    }

    if (logs[i].currentUserId) {
      // eslint-disable-next-line no-await-in-loop
      const logUser = await User.findOne({ where: { isDeleted: false, id: logs[i].currentUserId } });
      currentUserName = `${logUser?.name}`;
      // currentUser = await userRepository.find(logs[i]?.currentUserId);
      // employeeCD = `${currentUser?.employeeCD}`;
      // branch = `${currentUser?.branch}`;
      // department = `${currentUser?.department}`;
    } else {
      currentUserName = `${sender?.name}`;
      logs[i].isSender = true;
    }
    // let title = `${currentUserName} :action the request to ${nextUserName}`;
    let title = `${currentUserName} :action the request to ${nextUserName}.`;
    switch (Number(logs[i].actionId)) {
      case actions.Forward:
        if (logs[i].isSender) {
          if (logs[i].dataValues.comment != null) {
            title = `${currentUserName} sent a message.`;
          } else {
            title = `${currentUserName} re-submitted the request.`;
          }
        }
        title = title.replace(/:action/g, 'forwarded');
        break;
      case actions.Return:
        title = title.replace(/:action/g, 'returned');
        break;
      case actions.Refer:
        title = `${currentUserName} referred the request to ${nextUserName}.`;
        break;
      case actions.Approve:
        title = `${currentUserName} approved the request.`;
        break;
      case actions.Pick:
        title = `${currentUserName} picked the request.`;
        break;
      case actions.Reassign:
        title = `${currentUserName} re-assign the request to ${nextUserName}.`;
        break;
      case actions.SubForm:
        title = `${currentUserName} updated sub-form.`;
        break;
      case actions.Close:
        title = `${currentUserName} closed the request.`;
        break;
      case actions.RollBack:
        title = `${currentUserName} rollback the request.`;
        break;
      case actions.Verification:
        title = `${logs[i].comment} by ${currentUserName}.`;
        break;
      case actions.Comment:
        title = `${currentUserName} commented on the request.`;
        break;
      default:
        title = '';
    }
    timeline.push({
      id: logs[i].id,
      title,
      employeeCD,
      branch,
      department,
      groupId: logs[i] && logs[i].groupId ? logs[i].groupId : null,
      currentUserId: logs[i] && logs[i].currentUserId ? logs[i].currentUserId : null,
      comment: logs[i].comment,
      timestamp: moment(logs[i].createdAt).format('YYYY MMM DD h:mm A'),
      workflowFiles: logs[i].workflow_files,
      action: logs[i].actionId,
      canRollback: await canRollbackRequest(id, userId, logs[i].id),
    });
  }
  timeline.sort(function (a, b) {
    return new Date(a.id) - new Date(b.id);
  });
  // let query = readFileSync(resolve(__dirname, '../sql/singleRequestView.sql')).toString();
  // query = query.replace(/\s+/g, ' ');
  // query = query.replace(/:user/g, userId);
  // query = query.replace(/:requestId/g, request.id);
  // query = query.replace(/:uBranch/g, uBranch);
  // query = query.replace(/:singleBranch/g, singleBranch);

  // const output = (await db.query(query))[0];
  let trigger = false;
  trigger = await canTriggerRequest(id, userId);

  return {
    id: request.id,
    key: request.requestKey,
    status: request.statusId,
    swiftUpload: request.swiftUpload,
    signatureVerification: request.signatureVerified,
    localLC: request.localLC,
    swiftClosed: request.swiftClosed,
    reqSenderType: request.requestSenderType,
    customer: req.customer,
    form,
    createdAt: request.createdAt,
    fields: requestValues,
    timeline,
    levels: await getLevels(request.id),
    logs,
    canEdit: await canEditRequest(request.id, userId),
    canEditTemplate: await canEditTemplate(request.id, userId),
    canPick: [],
    // canPick: output,
    subform,
    allSubRequest,
    canTrigger: trigger,
  };
};

/**
 * Update the status of a specific request. The
 * status will be available on customer side.
 *
 * @param requestId
 * @param statusId
 */
const updateStatus = (requestId, statusId) => {
  return Request.update({ requestId, statusId }, { where: { id: requestId } });
};

const addToWorkflowMaster = async (requestId, workflowId, workflowLevel, groupId) => {
  const isActive = true;
  const isComplete = false;
  const { workflowLevelId } = workflowLevel[0][0];
  await WorkflowMaster.create({
    isActive,
    isComplete,
    requestId,
    workflowId,
    workflowLevelId,
    groupId,
  });
};

/**
 * Uploads file to DMS.
 *
 * @param requestKey
 * @param files
 * @returns {Promise<{data: null, success: boolean}|{data: *, success: boolean}>}
 */
const uploadToDMS = async (requestKey, files) => {
  const url = TO_DMS.UPLOAD_TO_DMS;
  const formData = new FormData();
  formData.append('document', requestKey);
  files.map((file) => {
    formData.append('files', fs.createReadStream(file.path));
    return true;
  });

  try {
    const { data } = await axios({
      method: 'post',
      url,
      data: formData,
      headers: formData.getHeaders(),
    });
    return {
      success: true,
      data: data.data.attachRes,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
    };
  }
};

/**
 * Add a record to workflow logs.
 *
 * @param requestId
 * @param actionId
 * @param groupId,
 * @param nextGroupId,
 * @param currentUserId,
 * @param comment
 * @param files
 * @returns {*}
 */
const writeToLog = async (requestId, actionId, groupId, nextGroupId, currentUserId, comment, files = null) => {
  // add an entry to workflow log
  const log = await WorkflowLog.create({
    requestId,
    groupId,
    nextGroupId,
    currentUserId,
    actionId,
    comment,
  });
  const { requestKey } = (
    await db.query(`SELECT TOP 1 [requestKey] as requestKey FROM requests where id = ${requestId}`)
  )[0][0];
  if (files) {
    files.map(async (file) => {
      // below line will upload file to dms
      // const uploadedFileInfo = await uploadToDMS(requestKey, [file]);
      const fileInfo = {
        workflowLogId: log.id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        path: file.path,
        filename: file.filename,
        size: file.size,
        // below line will upload file to dms
        // url: uploadedFileInfo.data[0].url,
      };
      await WorkflowFiles.create(fileInfo);
    });
  }
};

/**
 * Updates the timestamp on workflow master.
 * Insert started and completed time on workflow master softApprove column.
 * @param requestId
 * @param userId
 * @param column
 * @param value
 * @returns {*}
 */
const setWorkflowMasterTimestamp = (requestId, groupId, column, value) => {
  return WorkflowMaster.update(
    {
      [column]: value,
    },
    {
      where: {
        groupId,
        requestId,
      },
    }
  );
};

/**
 * Gets the next Group on current workflow.
 *
 * @param workflowId
 * @param currentUserId
 * @param requestId
 * @returns {Promise<*>}
 */
const getNextGroup = async (workflowId, groupId, requestId) => {
  return (
    await db.query(`select wm.groupId from workflow_masters wm
    join workflow_levels wl on wl.id = wm.workflowLevelId
    where wm.workflowId = ${workflowId} and wm.requestId = ${requestId} and
      level = (select level from workflow_masters wm join workflow_levels wl on wl.id = wm.workflowLevelId and wm.groupId = ${groupId} and wm.requestId = ${requestId}) + 1`)
  )[0];
};

/**
 * Gets workflow id from request
 * @param requestId
 * @returns {string|*}
 * TODO
 */
const getWorkFlowId = async (requestId) => {
  return (await db.query(`select top 1 workflowId from workflow_masters where requestId = ${requestId}`))[0][0].workflowId;
};

const isRequestComplete = async (requestId, action) => {
  if (action > 9) {
    return false;
  }
  const requestStatus = (await db.query(`select statusId from requests where id = ${requestId}`))[0][0].statusId;
  if (requestStatus == 4 || requestStatus == 6) {
    return true;
  }
  return false;
};
/**
 * Forwards a request to the next user on the workflow.
 *
 * @param requestId
 * @param data
 * @returns {Promise<boolean>}
 */
const forwardRequests = async (requestId, data) => {
  const { groupId, userId, comment } = data;
  const workflowId = await getWorkFlowId(requestId);
  const approver = await isGroupApprover(requestId, groupId);
  if (approver) {
    return false;
  }
  const multiApprove = await multiplePicker(requestId, groupId);
  const nextGroupId = await getNextGroup(workflowId, groupId, requestId);
  if (multiApprove == 'true') {
    await setWorkflowMasterTimestamp(requestId, groupId, 'completedOn', moment());
  }
  nextGroupId.map(async (group) => {
    await writeToLog(requestId, actions.Forward, groupId, group.groupId, userId, comment, data.files ? data.files : null);
  });
  // await setWorkflowMasterTimestamp(requestId, groupId, 'completedOn', moment());
  // await addToWorkflowMaster(requestId, workflowId, workflowLevelId, referGroupId);
  // await writeToLog(requestId, actions.Refer, groupId, referGroupId, userId, comment, data.files ? data.files : null);
  await updateStatus(requestId, status.Processing);
};

/**
 * Check if workflow level group for specific request has multiple approval left
 * true if (remaining approval is greater than 1) else (return false)
 * @param {*} requestId
 * @param {*} groupId
 * @returns
 */
const multiplePicker = async (requestId, groupId) => {
  return (
    await db.query(`SELECT CASE 
    WHEN (
      SELECT multiplePicker
      FROM workflow_masters wm
      WHERE requestId = ${requestId}
        AND groupId = ${groupId}
      ) is NULL
      THEN 'true'
  WHEN (
      SELECT multiplePicker
      FROM workflow_masters wm
      WHERE requestId = ${requestId}
        AND groupId = ${groupId}
      ) <= (
      SELECT count(*) + 1
      FROM workflow_logs wl
      WHERE requestId = ${requestId}
        AND groupId = ${groupId}
        AND actionId in (1, 3)
        AND (
					wl.updatedAt > (
						SELECT TOP 1 updatedAt
						FROM workflow_logs wl2
						WHERE wl2.requestId =  ${requestId}
							AND actionId = 2
						ORDER BY updatedAt DESC
						)
					OR NOT EXISTS (
						SELECT updatedAt
						FROM workflow_logs wl2
						WHERE wl2.requestId = ${requestId}
							AND actionId = 2
						)
					)
      )
    THEN 'true'
  ELSE 'false'
  END AS completeOnLevel
FROM workflow_masters wm2
WHERE requestId = ${requestId}
AND groupId = ${groupId}`)
  )[0][0].completeOnLevel;
};

/**
 * close a request.
 *
 * @param {*} requestId
 * @param {*} data
 */

const closeRequest = async (requestId, data) => {
  const { groupId, userId, comment } = data;

  await writeToLog(requestId, actions.Close, groupId, null, userId, comment, data.files ? data.files : null);
  await updateStatus(requestId, status.Closed);
};

const onlyComment = async (requestId, data) => {
  const { groupId, userId, comment } = data;
  await writeToLog(requestId, actions.Comment, groupId, null, userId, comment, data.files ? data.files : null);
};

/**
 * Refer a request to the user from out of the workflow.
 Add Action Refer
 Workflow master current user ko entry - startedon, completedon filled.
 Insert on same level id, the refer user id
 group id*
 add to log refer action
 *
 * @param requestId
 * @param data
 * @returns {Promise<boolean>}
 */
const referRequests = async (requestId, data) => {
  const { groupId, userId, referGroupId, comment } = data;
  const workflowId = await getWorkFlowId(requestId);
  // const approver = await isGroupApprover(requestId, groupId);
  // if (approver) {
  //   return false;
  // }
  const workflowLevelId = await getWorkflowLevelId(requestId, groupId);
  // const nextGroupId = await getNextGroup(workflowId, groupId, requestId);
  // nextGroupId.map(async (group) => {
  //   await setWorkflowMasterTimestamp(requestId, group.groupId, 'startedOn', moment());
  // });
  await setWorkflowMasterTimestamp(requestId, groupId, 'completedOn', moment());
  await addToWorkflowMaster(requestId, workflowId, workflowLevelId, referGroupId);
  await writeToLog(requestId, actions.Refer, groupId, referGroupId, userId, comment, data.files ? data.files : null);
  await updateStatus(requestId, status.Processing);
};

// To get same workflowlevelId for new refered group
const getWorkflowLevelId = async (requestId, groupId) => {
  return await db.query(
    `select workflowLevelId from workflow_masters where requestId = ${requestId} and groupId = ${groupId}`
  );
};

/**
 * Get the groups involved in the workflow ordered by their level.
 *
 * @param workflowId
 * @param requestId
 * @returns {Promise<[]>}
 */
const getWorkflowGroups = async (workflowId, requestId) => {
  const groups = [];
  const records = (
    await db.query(
      `select wm.groupId from workflow_masters wm
     join workflow_levels wl on wl.id = wm.workflowLevelId
     where wm.workflowId = ${workflowId} and wm.requestId = ${requestId} order by level`
    )
  )[0];
  await records.forEach((x) => {
    groups.push(x.groupId);
  });
  return groups;
};

/**
 * Reassign new group to the workflow (replacing existing group)
 * @param {*} requestId
 * @param {*} data
 */
const reassignRequests = async (requestId, data) => {
  const { userId, existingGroup, newGroup, comment } = data;

  WorkflowMaster.update(
    {
      groupId: newGroup,
      startedOn: null,
      completedOn: null,
    },
    {
      where: {
        groupId: existingGroup,
        requestId,
      },
    }
  );
  await writeToLog(requestId, actions.Reassign, existingGroup, newGroup, userId, comment, data.files ? data.files : null);
};

/**
 * Returns a request to  previous level or customer.
 * If a customer is selected. Resets all the fields.
 *
 * @param requestId
 * @param data
 * @returns {Promise<void>}
 */
const returnRequests = async (requestId, data) => {
  const { userId: currentUserId, groupId, returnGroupId, comment } = data;
  const workflowId = await getWorkFlowId(requestId);
  const workflowGroups = await getWorkflowGroups(workflowId, requestId);
  let nextGroupId = returnGroupId;

  const referid = await isReferredRequest(requestId, groupId);
  if (referid) {
    const referGroup = referid.groupId;
    const returnGroup = referid.nextGroupId;
    await setWorkflowMasterTimestamp(requestId, referGroup, 'completedOn', null);
    await setWorkflowMasterTimestamp(requestId, returnGroup, 'completedOn', moment());
    await setWorkflowMasterTimestamp(requestId, returnGroup, 'softApprove', moment() + '');

    await writeToLog(
      requestId,
      actions.Return,
      returnGroup,
      referGroup,
      currentUserId,
      comment,
      data.files ? data.files : null
    );
  } else {
    if (data.isInitiator) {
      let corporateRegistration = (
        await db.query(`select r.formId from requests r
          where r.id = ${requestId}`)
      )[0][0]; // and r.requestSenderType = 'customer'
      if (corporateRegistration?.formId && corporateRegistration.formId == 13) {
        return {
          status: false,
          message:
            'THIS FLOW CAN NOT BE RETURNED TO CUSTOMER. PLEASE UPLOAD REQUIRED INFORMATION MANUALLY AND TAKE ACTION ACCORDINGLY.',
        };
      }
      // if the isInitiator is not null, disregard returnUserId and reset to the first point.
      nextGroupId = null;
      await workflowGroups.map(async (gID) => {
        const softDetail = await validateMultiGroup(requestId, gID);
        if (!softDetail || gID == groupId) {
          await setWorkflowMasterTimestamp(requestId, gID, 'startedOn', null);
          await setWorkflowMasterTimestamp(requestId, gID, 'completedOn', null);
        }
      });
      //send email here for return request
      await sendActionMail(requestId, 'return', comment);
      await updateStatus(requestId, status.Returned);
    } else {
      const index = workflowGroups.indexOf(Number(nextGroupId));
      const resetGroups = workflowGroups.slice(index + 1);
      await resetGroups.map(async (gID) => {
        const softDetail = await validateMultiGroup(requestId, gID);
        if (!softDetail || gID == groupId) {
          await setWorkflowMasterTimestamp(requestId, gID, 'startedOn', null);
          await setWorkflowMasterTimestamp(requestId, gID, 'completedOn', null);
        }
      });
      await sendActionMailBranch(requestId, 'return', comment, nextGroupId);
      await setWorkflowMasterTimestamp(requestId, nextGroupId, 'startedOn', null);
      await setWorkflowMasterTimestamp(requestId, nextGroupId, 'completedOn', null);
    }
    await writeToLog(
      requestId,
      actions.Return,
      groupId,
      nextGroupId,
      currentUserId,
      comment,
      data.files ? data.files : null
    );
  }
  return { status: true };
};

/**
 * Approves the request.
 * Set completed on approving user.
 * Write to log
 * Update request status.
 *
 * @param requestId
 * @param data
 * @returns {Promise<void>}
 */
const approveRequests = async (requestId, data) => {
  // if the level has multiple group
  // check if all the group approved
  // if all group approved run trigger.
  // send post request to trigger url with customer/sender information, request values, sub form values
  // if the response is OK, insert as approved to the database.
  // if not return error, failed to run trigger.

  const { groupId, userId: currentUserId, comment } = data;

  //Checking if the current approver is last one to approve
  const isFinal = await finalApprover(requestId, groupId);
  const finalAction = await multiplePicker(requestId, groupId);
  if (isFinal && finalAction == 'true') {
    await updateStatus(requestId, status.Completed);
    //send email to customer here
    await sendActionMail(requestId, 'approve');
    await sendActionMailBranch(requestId, 'approve');
  }
  if (finalAction == 'true') {
    await setWorkflowMasterTimestamp(requestId, groupId, 'completedOn', moment());
  }
  const softDetail = await validateMultiGroup(requestId, groupId);
  if (softDetail) {
    await setWorkflowMasterTimestamp(requestId, groupId, 'softApprove', softDetail);
  }
  await writeToLog(requestId, actions.Approve, groupId, null, currentUserId, comment, data.files ? data.files : null);
};

const sendActionMailBranch = async (requestId, action, comment = '', nextGroup) => {
  let data = (
    await db.query(`select r.requestKey, f.name, f.id from requests r
      join forms f on f.id = r.formId 
      where r.id = ${requestId} and f.id in (1, 2, 3, 4)`)
  )[0][0];

  let receiver = [];
  if (action === 'return') {
    receiver = (
      await db.query(`select u.email from requests r
      join workflow_masters wm on wm.requestId = r.id 
      join group_users gu on gu.groupId = wm.groupId      
      join users u on u.id = gu.userId    
      join forms f on f.id = r.formId 
      where r.id = ${requestId} and gu.groupId = ${nextGroup} and f.id in (1, 2, 3, 4) and u.solID = r.requestedBranch`)
    )[0];
    receiver = receiver.map((obj) => obj.email);
    await sendRequestReturnEmailBranch({
      request: requestId,
      key: data?.requestKey || '',
      customer: data?.accountName || '',
      comment: comment || '',
      email: receiver,
      form: data?.name.substring(0, 2) || '',
    });
  }
  if (action === 'approve') {
    receiver = (
      await db.query(`select u.email from requests r
      join workflow_masters wm on wm.requestId = r.id 
      join group_users gu on gu.groupId = wm.groupId      
      join users u on u.id = gu.userId    
      join forms f on f.id = r.formId 
      join workflow_levels wl on wl.id = wm.workflowLevelId  
      where r.id = ${requestId} and f.id in (1, 2, 3, 4) and u.solID = r.requestedBranch and wl.[level] = 0`)
    )[0];
    receiver = receiver.map((obj) => obj.email);
    await sendRequestApproveEmailBranch({
      request: requestId,
      key: data?.requestKey || '',
      customer: data?.accountName || '',
      email: receiver,
      form: data?.name.substring(0, 2) || '',
      id: data?.id,
    });
  }
};

const sendActionMail = async (requestId, action, comment = '') => {
  let data = (
    await db.query(`select r.requestKey, c.accountName, c.email,  f.name from requests r
      join customers c on c.id = r.requestSenderId 
      join forms f on f.id = r.formId 
      where r.id = ${requestId} and r.requestSenderType = 'customer' and f.id in (1, 2, 3, 4)`)
  )[0][0];
  if (action === 'return') {
    await sendRequestReturnEmail({
      key: data?.requestKey || '',
      customer: data?.accountName || '',
      comment: comment || '',
      email: data?.email || '',
      form: data?.name.substring(0, 2) || '',
    });
  }
  if (action === 'approve') {
    await sendRequestApproveEmail({
      key: data?.requestKey || '',
      customer: data?.accountName || '',
      email: data?.email || '',
      form: data?.name.substring(0, 2) || '',
    });
  }
};

const validateMultiGroup = async (requestId, groupId) => {
  const groups = await isMultiGroupLevel(requestId, groupId);
  let approveTime = null;
  if (groups.length > 1) {
    groups.map((group) => {
      if (group.groupId == groupId) {
        approveTime = group.startedOn + ' and ' + group.completedOn;
      }
    });
  }
  return approveTime;
};

const isMultiGroupLevel = async (requestId, groupId) => {
  const wfDetail = (
    await db.query(`select * from workflow_levels where id = 
          (select workflowLevelId from workflow_masters where requestId = ${requestId} and groupId = ${groupId})`)
  )[0][0];

  if (wfDetail) {
    return (
      await db.query(`select wl.groupId, wm.startedOn, wm.completedOn from workflow_levels wl join 
                      workflow_masters wm on wm.workflowLevelId = wl.id 
                      where wl.workflowId = ${wfDetail.workflowId} and wl.level = ${wfDetail.level} and wm.requestId = ${requestId}`)
    )[0];
  }
  return null;
};

/**
 * Check if the current group is final to approve the given request
 * @param {*} requestId
 * @param {*} groupId
 * @returns
 */
const finalApprover = async (requestId, groupId) => {
  const remainingApprovers = (
    await db.query(
      `select distinct wm.* from
    (select * from workflow_levels where isApprover = 1) w
    join (select * from workflow_masters where completedOn IS NULL) wm on wm.workflowId = w.workflowId
    join workflow_logs wl on wm.requestId = wl.requestId where wm.requestId = ${requestId}`
    )
  )[0];

  let approvers = [];
  for (let i = 0; i < remainingApprovers.length; i++) {
    if (remainingApprovers[i].softApprove == null || remainingApprovers[i].groupId == groupId) {
      approvers.push(remainingApprovers[i]);
    }
  }
  if (approvers && approvers.length === 1 && approvers[0].groupId == groupId) {
    return true;
  }
  return false;
};

const allApproved = async (requestId, workflowLevelId) => {
  return await db.query(
    `select * from workflow_masters where requestId = ${requestId} and workflowLevelId in ( select id from workflow_levels where [level] = (select [level] from workflow_levels where id =  ${workflowLevelId})) and (startedOn is NULL or completedOn is NULL)`
  );
};

const notPicked = async (requestId, groupId) => {
  const workflowLog = await WorkflowLog.findOne({
    where: {
      requestId,
      groupId,
      actionId: 4,
    },
  });
  if (workflowLog === null) {
    return true;
  }
  return false;
};

/**
 * @param requestId
 * @param data
 * @returns {Promise<void>}
 * Pick the request from the bucket.
 */
const pickRequest = async (requestId, data, uBranch, singleBranch) => {
  const { groupId, userId, comment } = data;
  const resut = await userOnMultipleGroup(requestId, userId);
  if (resut) {
    return { status: false, message: 'User exist on multiple groups. Can not pick request.' };
  }

  let query = readFileSync(resolve(__dirname, '../sql/singleRequestView.sql')).toString();
  query = query.replace(/\s+/g, ' ');
  query = query.replace(/:user/g, userId);
  query = query.replace(/:requestId/g, requestId);
  query = query.replace(/:uBranch/g, uBranch);
  query = query.replace(/:singleBranch/g, singleBranch);
  const output = (await db.query(query))[0];

  if (output && output.length > 0) {
    await setWorkflowMasterTimestamp(requestId, groupId, 'startedOn', moment());
    await writeToLog(requestId, actions.Pick, groupId, null, userId, comment, data.files ? data.files : null);
    await updateStatus(requestId, status.Processing);
    return { status: true };
  } else {
    return { status: false };
  }
};

const userOnMultipleGroup = async (requestId, userId) => {
  const record = (
    await db.query(`SELECT DISTINCT g.id FROM requests r 
    JOIN workflow_masters wm ON r.id = wm.requestId 
    JOIN groups g ON g.id = wm.groupId
    JOIN group_users gu ON gu.groupId = g.id AND gu.userId = ${userId}
    AND r.id = ${requestId} AND gu.isDeleted = 0`)
  )[0];
  if (record.length > 1) {
    return true;
  }
  return false;
};

/**
 * @param requestId
 * @param data
 * @returns {Promise<void>}
 * Updated the sub-form in request.
 */
const subFormRequest = async (requestId, data) => {
  const { groupId, userId, comment } = data;
  await writeToLog(requestId, actions.SubForm, groupId, null, userId, comment, data.files ? data.files : null);
};

/**
 * Performs workflow action on request.
 *
 * @param id
 * @param data
 * @returns {Promise<boolean>}
 */
const action = async (id, data, uBranch, singleBranch, reqData) => {
  const completed = await isRequestComplete(id, data.actionId);
  if (completed) {
    return { status: false };
  }

  // available actions are forward, return, approve and reject.
  switch (Number(data.actionId)) {
    case actions.Forward:
      await forwardRequests(id, data);
      break;
    case actions.Return:
      // reset startedOn and completedOn until the nextUserId
      // if customer is selected set request status to returned.
      await returnRequests(id, data);
      break;
    case actions.Approve:
      // set completedOn on current user Id.
      // change request status to approved.
      await approveRequests(id, data);
      break;
    case actions.Pick:
      return await pickRequest(id, data, uBranch, singleBranch);
      break;
    case actions.Refer:
      await referRequests(id, data);
      break;
    case actions.Reassign:
      await reassignRequests(id, data);
      break;
    case actions.SubForm:
      await subFormRequest(id, data);
      break;
    case actions.Close:
      await closeRequest(id, data);
      break;
    case actions.RollBack:
      await rollbackRequest(id, data);
      break;
    case actions.Verification:
      return await verifyRequest(id, data, reqData);
      break;
    case actions.Comment:
      await onlyComment(id, data);
      break;
    default:
      return { status: false };
  }
  return { status: true };
  // if the action is forwarded, set the completed on and started on value for two users.
  // if the action is returned, reset all the values until the return user
  // if the action is approve, set the status to approve.
  // if the action is reject, set the status to rejected.
};

/**
 * @param workflowId
 * @param userId
 * @returns {Promise<boolean|{defaultValue: boolean, type: *}|*>}
 * Checks if the group containing current user is approver for the workflow.
 */
const isGroupApprover = async (requestId, groupId) => {
  return (
    await db.query(`select isApprover from workflow_levels where id = (
      select workflowLevelId from workflow_masters where requestId = ${requestId} and groupId = ${groupId})`)
  )[0][0].isApprover;
};

/**
 *
 * @param {*} requestId
 * @param {*} userId
 * To find in which group current user belongs to
 */
const findUserGroup = async (requestId, userId) => {
  const result = (
    await db.query(
      `select top 1 groupId from workflow_masters where requestId = ${requestId} and groupId in (select groupId from group_users where userId = ${userId})`
    )
  )[0][0];
  return result && result.groupId ? result.groupId : null;
};

const isReferredRequest = async (id, groupId) => {
  return (
    await db.query(`
  select * from workflow_logs where requestId = ${id} and actionId = 5 and nextGroupId = ${groupId}`)
  )[0][0];
};

const availableActions = async (id, userId) => {
  if (await canEditRequest(id, userId)) {
    const groupId = await findUserGroup(id, userId);
    const checkApprover = await isGroupApprover(id, groupId);
    const referid = await isReferredRequest(id, groupId);
    if (referid) {
      return Action.findAll({
        where: {
          displayable: true,
          id: [2],
        },
      });
    }
    if (checkApprover) {
      return Action.findAll({
        where: {
          displayable: true,
          id: [2, 3, 5, 8],
        },
      });
    }
    return Action.findAll({
      where: {
        displayable: true,
        id: [1, 2, 5, 8],
      },
    });
  }
};

/**
 * select only the groups without the user involved in the workflow for given request
 */
const getReferGroups = async (requestId, solId) => {
  return (
    await db.query(
      `select g.* from groups g
          join group_users gu on g.id = gu.groupId
          join users u on u.id = gu.userId where u.id not in(
            select distinct u.id from users u
            join group_users gu on gu.userId = u.id
            join workflow_masters wm on gu.groupId = wm.groupId
            where wm.requestId = ${requestId}) and u.solID = '${solId}'`
    )
  )[0];
};

const getReturnGroups = async (requestId, userId) => {
  // To find which group the user is involved in
  const groupId = await findUserGroup(requestId, userId);
  // To check if the request to be returned is referred to him or not
  const referid = await isReferredRequest(requestId, groupId);

  let returnGroups = (
    await db.query(
      `select g.id, g.name, wl.level
       from requests r
              join workflow_masters wm on r.id = wm.requestId
              join workflow_levels wl on wm.workflowLevelId = wl.id
              join groups g on wl.groupId = g.id
       where r.id = ${requestId}
         and level < (select distinct top 1 *
                      from (select distinct wl.level
                            from requests
                                   join workflow_masters wm on requests.id = wm.requestId
                                   join workflow_levels wl on wm.workflowLevelId = wl.id
                                   join groups g on wl.groupId = (select distinct top 1 g.id
                                                                  from requests r
                                                                         join workflow_masters wm on r.id = wm.requestId
                                                                         join workflow_levels wl on wm.workflowLevelId = wl.id
                                                                         join groups g on wl.groupId = g.id
                                                                  where r.id = ${requestId}
                                                                    and g.id in (select groupId
                                                                                 from groups
                                                                                        join group_users gu on groups.id = gu.groupId
                                                                                        join users u on u.id = gu.userId
                                                                                 where u.id = ${userId}))) as rwwgl
                      order by level desc);`
    )
  )[0];

  // If the request is referred one return back to the referrer
  if (referid) {
    returnGroups.splice(0, 0, { name: 'Referrer', userId: 0 });
  } else {
    returnGroups.splice(0, 0, { name: 'Applicant', userId: 0 });
  }
  return returnGroups;
};

const getSubform = async (requestId, userId) => {
  const groupId = await findUserGroup(requestId, userId);
  return await db.query(
    // Sub form according to the group assigned
    // `select subformId from workflow_levels where id = (select top 1 workflowLevelId from workflow_masters where requestId = ${requestId} and groupId = ${groupId})`

    // Sub form according to form only
    `select top 1 wl.subformId from workflow_levels wl where wl.workflowId = (select f.workflowId from forms f join requests r on r.formId = f.id where r.id = ${requestId}) and wl.subformId IS NOT NULL`
  );
};

const getPrintRequest = async (requestId) => {
  return (
    await db.query(`select DISTINCT pt.id, pt.name from requests r
    join forms f on f.id = r.formId
    join print_temp_forms ptf on f.id = ptf.formId 
    join request_values rv on rv.requestId  = r.id
    join print_temps pt on  
      CASE WHEN f.name LIKE 'BG Form%' THEN 
      (CASE WHEN pt.type = REPLACE((SELECT value FROM request_values rv WHERE name = 'type_of_guarantee' and requestId = ${requestId}), '"', '')
        THEN 
        ptf.printTempId
        ELSE 
        0
        END)
      ELSE
         ptf.printTempId 
      END = pt.id
    WHERE r.id = ${requestId};`)
  )[0];
  // pt.customerAccess = 1 and r.id = ${requestId};
};

const rollbackRequest = async (requestId, data) => {
  const { groupId, userId, comment } = data;

  await writeToLog(requestId, actions.RollBack, groupId, null, userId, comment, data.files ? data.files : null);
  await setWorkflowMasterTimestamp(requestId, groupId, 'completedOn', null);
  await updateStatus(requestId, status.Processing);
};

const verifyRequest = async (id, data, reqData) => {
  const { groupId, userId, comment, verify } = data;
  if (verify == 'customerRegistration') {
    const regsiterData = JSON.parse(reqData);
    const register = await registerCorporate(regsiterData);
    if (register.code == 1) {
      const result = await writeToLog(
        id,
        actions.Verification,
        groupId,
        null,
        userId,
        'Customer registered successfully. Mail send to ' + regsiterData.registration_email,
        data.files ? data.files : null
      );
    }
    return register;
  }
  const check = await Request.findOne({ where: { id }, attributes: [`${verify}`] });
  if (verify == 'swiftUpload') {
    if (check && check.swiftUpload) {
      const result = await updateRequestAndLog(id, data, 'swiftUpload', false, 'Swift upload disproved');
      return { status: true, result, message: 'Swift upload disproved.' };
    } else {
      const result = await updateRequestAndLog(id, data, 'swiftUpload', true, 'Swift upload verified');
      return { status: true, result, message: 'Swift upload verified.' };
    }
  }
  if (verify == 'signatureVerified') {
    if (check && check.signatureVerified) {
      const result = await updateRequestAndLog(id, data, 'signatureVerified', false, 'Signature disproved');
      return { status: true, result, message: 'Signature  disproved.' };
    } else {
      const result = await updateRequestAndLog(id, data, 'signatureVerified', true, 'Signature verified');
      return { status: true, result, message: 'Signature  verified.' };
    }
  }
  if (verify == 'localLC') {
    if (check && check.localLC) {
      const result = await updateRequestAndLog(id, data, 'localLC', false, 'Local LC unverified');
      return { status: true, result, message: 'Local LC unverified.' };
    } else {
      const result = await updateRequestAndLog(id, data, 'localLC', true, 'Local LC verified');
      return { status: true, result, message: 'Local LC verified.' };
    }
  }
  if (verify == 'swiftClosed') {
    if (check && check.swiftClosed) {
      const result = await updateRequestAndLog(id, data, 'swiftClosed', false, 'Reopen closed swift LC');
      return { status: true, result, message: 'Reopen closed swift LC.' };
    } else {
      const result = await updateRequestAndLog(id, data, 'swiftClosed', true, 'LC closed on swift');
      return { status: true, result, message: 'LC closed on swift.' };
    }
  }
};

const updateRequestAndLog = async (id, data, key, value, msg) => {
  const { groupId, userId } = data;
  const filter = {};
  filter[key] = value;
  const result = await Request.update(filter, { where: { id } });
  await writeToLog(id, actions.Verification, groupId, null, userId, msg, data.files ? data.files : null);
  return result;
};

module.exports = {
  all,
  single,
  action,
  getWorkFlowId,
  availableActions,
  findUserGroup,
  countAll,
  getReferGroups,
  getSubform,
  getReturnGroups,
  getPrintRequest,
  requestsCount,
  verifyRequest,
  internalRequestsCount,
  getCorporateInternalCount,
  getCorporateExternalCount,
};
