const httpStatus = require('http-status');
const { isEmpty } = require('lodash');
const fs = require('fs');
const pdf = require('pdf-creator-node');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Handlebars = require('handlebars');
const { getPagingData } = require('../utils/pagination');
const { getPagination } = require('../utils/pagination');
const { requestRepository, fileRepository } = require('../repositories');
const { requestService } = require('../services');
const { respond } = require('../utils/response');
const { promisify } = require('util');
const { bucketRequestQuery } = require('../sql/requestList');
const { Op } = require('sequelize');
const { QueryTypes } = require('sequelize');

const {
  Request,
  RequestValue,
  DraftRequest,
  DraftRequestValue,
  SubRequest,
  SubRequestValue,
  Customer,
  WorkflowLog,
  WorkflowFiles,
} = require('../models');
const Validate = require('../validations/dynamic');
const { HTTP } = require('../constants/response');
const db = require('../config/database');
const { decode } = require('html-entities');
const excel = require('node-excel-export');
const _ = require('lodash');
const crypto = require('crypto');
const argon2 = require('argon2');
const redis = require('../config/redis');
const { userService } = require('../services');
const userRepository = require('../repositories/user');
const { actions } = require('../constants/request');
const { groupRepository } = require('../repositories');
const { request } = require('http');
const { RollBackRequest } = require('../repositories/request');
const { ftp, checkFtp, config } = require('../config/filesystem');
const user = require('../models/user');
const { sendMessageTemp } = require('../channels/email/send_email');
const { uploadAttachments } = require('../config/ftpConfig');
const moment = require('moment');
const puppeteer = require('puppeteer');
const formatRequests = require('../utils/formatRequests');
/**
 * Get all the requests.
 *
 * @param req
 * @param res
 */
const all = async (req, res) => {
  let tab = 'pending';
  let reqType = 'customer';
  const userId = req.user.id;
  let singleBranch = 'false';
  if (req.user?.permissions?.length > 0 && req.user.permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const { page, pageSize } = req.query;
  const { limit, offset } = getPagination(page, pageSize);

  if (req.query?.tab) {
    tab = req.query.tab;
  }
  if (req.query?.reqType) {
    reqType = req.query.reqType;
  }
  let search = '';
  let searchkey = '';
  if (req.query?.search) {
    let filterQuery = '';
    search = JSON.parse(req.query.search);
    for (const filter of search) {
      switch (filter.operator) {
        case 'equals':
          filterQuery += ` AND (${filter?.field} = '${filter?.value}')`;
          break;
        case 'like':
          filterQuery += ` AND (${filter?.field} LIKE '%${filter?.value}%')`;
          break;
        case 'starts-with':
          filterQuery += ` AND (${filter?.field} LIKE '${filter?.value}%')`;
          break;
        case 'ends-with':
          filterQuery += ` AND (${filter?.field} LIKE '%${filter?.value}')`;
          break;
        case 'date-range':
          const startDate = filter?.value;
          const endDate = filter?.value2;
          filterQuery += ` AND (${filter?.field} BETWEEN '${startDate}' AND '${endDate}')`;
          break;
        default:
          break;
      }
    }
    search = filterQuery;
  }

  let startDate = '';
  let endDate = '';
  let switchCustomer = req.query?.switchCustomer ? req.query?.switchCustomer : '';

  if (req.query?.startDate) {
    startDate = req.query.startDate;
    endDate = req.query.endDate;
  }

  const requests = await requestRepository.all(
    tab,
    userId,
    reqType,
    limit,
    offset,
    search,
    searchkey,
    startDate,
    endDate,
    req.user.solId,
    singleBranch,
    switchCustomer
  );

  const totalRequests = await requestRepository.countAll(
    tab,
    userId,
    reqType,
    limit,
    offset,
    search,
    searchkey,
    startDate,
    endDate,
    req.user.solId,
    singleBranch,
    switchCustomer
  );
  const rowData = {
    rows: requests[0],
    count: totalRequests[0][0].total,
  };
  const requestData = await getPagingData(rowData, page, limit, offset);
  return respond(res, httpStatus.OK, null, requestData);
};

/**
 * Returned the requests count for bucket, pending,
 * upcoming, approved and returned. This route is created
 * to display the requests count on the dashboard.
 *
 *
 * @param {*} req
 * @param {*} res
 * @returns
 */
const getRequestsCount = async (req, res) => {
  const userId = req.user.id;
  let singleBranch = 'false';
  if (req.user?.permissions?.length > 0 && req.user.permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const data = (await requestRepository.requestsCount(userId, req.user.solId, singleBranch))[0];
  let formattedData = {};
  for (let i = 0; i < data.length; i++) {
    if (data[i].hasOwnProperty('status') && data[i].hasOwnProperty('count')) {
      formattedData[data[i].status.toLowerCase()] = data[i].count;
    }
  }
  return respond(res, httpStatus.OK, null, formattedData);
};

const getAllRequestsCount = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user.id
    const result = await db.query(
      `EXEC [dbo].[RequestCount]
      @UserId = ${req.user.id},
      @SOL = N'01'`
    );
    const getFormattedRequests = await formatRequests(result[0]);

    return respond(res, httpStatus.OK, null, getFormattedRequests);
  } catch (error) {
    console.error('Error executing stored procedure:', error);
    res.status(500).send('Internal Server Error');
  }
};

const getInternalCount = async (req, res) => {
  const userId = req.user.id;
  let singleBranch = 'false';
  if (req.user?.permissions?.length > 0 && req.user.permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const data = (await requestRepository.internalRequestsCount(userId, req.user.solId, singleBranch))[0];
  let formattedData = {};
  for (let i = 0; i < data.length; i++) {
    if (data[i].hasOwnProperty('status') && data[i].hasOwnProperty('count')) {
      formattedData[data[i].status.toLowerCase()] = data[i].count;
    }
  }
  return respond(res, httpStatus.OK, null, formattedData);
};

const getCorporateInternalCount = async (req, res) => {
  const userId = req.user.id;
  let singleBranch = 'false';
  if (req.user?.permissions?.length > 0 && req.user.permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const data = (await requestRepository.getCorporateInternalCount(userId, req.user.solId, singleBranch))[0];
  let formattedData = {};
  for (let i = 0; i < data.length; i++) {
    if (data[i].hasOwnProperty('status') && data[i].hasOwnProperty('count')) {
      formattedData[data[i].status.toLowerCase()] = data[i].count;
    }
  }
  return respond(res, httpStatus.OK, null, formattedData);
};
const getCorporateExternalCount = async (req, res) => {
  const userId = req.user.id;
  let singleBranch = 'false';
  if (req.user?.permissions?.length > 0 && req.user.permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const data = (await requestRepository.getCorporateExternalCount(userId, req.user.solId, singleBranch))[0];
  let formattedData = {};
  for (let i = 0; i < data.length; i++) {
    if (data[i].hasOwnProperty('status') && data[i].hasOwnProperty('count')) {
      formattedData[data[i].status.toLowerCase()] = data[i].count;
    }
  }
  return respond(res, httpStatus.OK, null, formattedData);
};

/**
 * Get a specific request.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  let singleBranch = 'false';
  if (req.user?.permissions?.length > 0 && req.user.permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const data = await requestRepository.single(id, req.user.id, req.user.solId, singleBranch);
  return respond(res, httpStatus.OK, null, data);
};

/**
 * Carry out action on the request.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const action = async (req, res) => {
  // TODO: check if the user is allowed to perform the action.
  const { id } = req.params;
  const userId = req.user.id;
  const groupId = (await requestRepository.findUserGroup(id, userId)) || null;
  let isInitiator = false;
  if (req.body.returnGroupId === 'undefined') {
    isInitiator = true;
  }
  let singleBranch = 'false';
  if (req.user?.permissions?.length > 0 && req.user.permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const performed = await requestService.action(
    id,
    {
      actionId: req.body.actionId,
      userId,
      groupId,
      comment: req.body.comment,
      returnGroupId: req.body.returnGroupId,
      referGroupId: req.body.referGroupId,
      existingGroup: req.body.existingGroup,
      newGroup: req.body.newGroup,
      isInitiator,
      //In case of verification action i.e. (Swift and Signature verification)
      verify: req.body?.verify || '',
      files: req.files,
    },
    req.user.solId,
    singleBranch,
    req.body.reqData
  );
  if (!performed.status) {
    return respond(res, httpStatus.NOT_ACCEPTABLE, performed?.message || 'Failed to perform action on request.', performed);
  }
  return respond(res, httpStatus.OK, performed?.message || 'Action performed on request', performed);
};

/**
 * Post Request Send by Client.
 */
const store = async (req, res) => {
  // check if draftId exists on the request and the draft id exists on the drafts table.
  // check if the draft is created by the same user who is submitting the request.
  // the current request is coming from drafted requested.
  // find the drafted request and its request values and delete them.

  const draftRequestId = req.body.id;
  const { formId } = req.body;
  const { statusId } = req.body;
  const isDynamic = req.body.isDynamic ? req.body.isDynamic : null;
  const { requestSenderId } = req.body; // TODO: get requestSenderId from customer or user.
  const requestSenderType = 'user';
  let { requestValues } = req.body;
  let fileList = [];
  if (isDynamic) {
    requestValues = JSON.parse(req.body.requestValues);
    if (req.body.fileList) {
      fileList = JSON.parse(req.body.fileList);
    }
    const error = await Validate(req);
    if (!isEmpty(error)) {
      return respond(res, HTTP.StatusPreconditionFailed, 'Please fill all the required fields.', error);
    }
  }
  const request = {
    requestKey: '',
    formId,
    statusId,
    requestSenderId,
    requestSenderType,
  };

  Request.create(request).then(async (request) => {
    await Promise.all([
      ...requestValues.map((requestValue) => {
        // TODO: change type based on form-builder type.
        const insertRequestValue = {
          formId,
          requestId: request.id,
          name: requestValue.name,
          value: JSON.stringify(requestValue.value),
        };
        if (requestValue.name.includes('fileupload')) {
          const fileField = fileList.find((x) => x.fieldName === requestValue.name);
          if (fileField) {
            insertRequestValue.type = 'file';
            insertRequestValue.label = fileField.label ? fileField.label : requestValue.name;
            insertRequestValue.value = JSON.stringify(req.files.find((x) => x.fieldname === requestValue.name));
            return RequestValue.create(insertRequestValue);
          }
          return null;
        }
        insertRequestValue.type = 'text';
        insertRequestValue.label = requestValue.label ? requestValue.label : requestValue.name;
        return RequestValue.create(insertRequestValue);
      }),
      draftRequestId &&
        DraftRequestValue.destroy({ where: { draftRequestId } }).then(() => {
          DraftRequest.destroy({ where: { id: draftRequestId } });
        }),
    ]);
    return respond(res, HTTP.StatusOk, 'New request submitted successfully.');
  });
};

const viewCustomerFile = async (req, res) => {
  // TODO: send file for download. add extension to file.
  let type = 'request';
  if (req.params.type) {
    type = req.params.type;
  }
  const fileNameInfo = await fileRepository.getCustomerOriginalFileName(req.params.id, type);
  if (!fileNameInfo) {
    return respond(res, httpStatus.NOT_FOUND, 'File not found');
  }
  const filePath = await fileRepository.getCustomerFilePath(req.params.filename);
  if (!filePath) {
    return respond(res, httpStatus.NOT_FOUND, 'File not found');
  }

  // TODO: strict checking of file name match.
  if (fileNameInfo.fileName.includes(req.params.filename)) {
    const isConnected = await new Promise((resolve) => checkFtp((isConnected) => resolve(isConnected)));
    if (isConnected) {
      ftp.connect(config);
      const isSuccess = await new Promise((resolve) => {
        ftp.download(`/${fileNameInfo.fileName}`, 'temp', (err) => {
          if (err) {
            console.log(err);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
      ftp.close();
      console.log(fileNameInfo.fileName, isSuccess);
      if (isSuccess) {
        return res.download(`temp/${fileNameInfo.fileName}`);
      } else {
        return respond(res, httpStatus.NOT_FOUND, 'File not found');
      }
      // return ftp.download(`/${fileNameInfo.fileName}`);
    }
  }
};

const downloadTemplateFile = (req, res) => {
  const { file } = req.params;
  const filePath = path.resolve(__dirname, '../../temp', file);
  return res.download(filePath, file);
};

const getAvailableActions = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await requestRepository
    .availableActions(id, userId)
    .then((actions) => {
      return respond(res, httpStatus.OK, 'Get all available actions', actions);
    })
    .catch(() => {
      return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!');
    });
};

const getReferGroups = async (req, res) => {
  const { requestId } = req.query;
  await requestRepository
    .getReferGroups(requestId, req.user.solId)
    .then((groups) => {
      return respond(res, httpStatus.OK, 'Get all available groups for refer', groups);
    })
    .catch(() => {
      return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!');
    });
};

const getReturnGroups = async (req, res) => {
  const { requestId, userId } = req.query;
  await requestRepository
    .getReturnGroups(requestId, userId)
    .then((groups) => {
      return respond(res, httpStatus.OK, 'Fetched all available return groups.', groups);
    })
    .catch(() => {
      return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch available return groups.');
    });
};

const getSubform = async (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;
  await requestRepository
    .getSubform(requestId, userId)
    .then((subform) => {
      return respond(res, httpStatus.OK, 'Sub form for specific request', subform);
    })
    .catch(() => {
      return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!');
    });
};

const storeSub = async (req, res) => {
  const requestId = Number(req.body.requestId);
  const subFormId = Number(req.body.subFormId);
  const senderId = req.user.id;
  let { requestValues } = req.body;
  requestValues = JSON.parse(req.body.requestValues);

  const subRequest = {
    requestId,
    subFormId,
    senderId,
  };

  let requestIdentificationNumber = requestValues.filter((value) => {
    if (value.name.includes('requestIdentifier_')) {
      return value;
    }
  });
  if (requestIdentificationNumber.length > 0 && requestIdentificationNumber[0].value) {
    Request.update({ identifier: requestIdentificationNumber[0].value }, { where: { id: requestId } });
  }

  const subRequestId = await SubRequest.findOne({
    where: { isDeleted: false, requestId, subFormId, senderId },
  });

  if (subRequestId) {
    SubRequest.update(subRequest, { where: { id: subRequestId.id } }).then(async (request) => {
      await Promise.all([
        requestValues &&
          requestValues.map(async (item) => {
            return Promise.all([
              SubRequestValue.update(
                {
                  name: item.name,
                  value: JSON.stringify(item.value),
                  label: item.label,
                },
                {
                  where: {
                    subRequestId: subRequestId.id,
                    name: item.name,
                  },
                }
              ),
            ]);
          }),
      ]);
      return respond(res, HTTP.StatusOk, 'Sub-request updated successfully.');
    });
  } else {
    SubRequest.create(subRequest).then(async (request) => {
      await Promise.all([
        ...requestValues.map((requestValue) => {
          // TODO: change type based on form-builder type.
          const insertRequestValue = {
            subRequestId: request.id,
            name: requestValue.name,
            value: JSON.stringify(requestValue.value),
          };
          insertRequestValue.type = 'text';
          insertRequestValue.label = requestValue.label ? requestValue.label : requestValue.name;
          return SubRequestValue.create(insertRequestValue);
          // }
        }),
      ]);
      return respond(res, HTTP.StatusOk, 'Sub-request updated successfully.');
    });
  }
};

/**
 * Query for retrieving template data
 *
 * @param {*} templateId
 * @returns
 */
const getTemplateData = async (templateId) => {
  return (await db.query(`select * from print_temps where id = ${templateId};`))[0][0];
};

const sanitizeTemplate = (template) => {
  // let temp = template.slice(1, -1);
  if (template != '' && template != null) {
    let temp = template.replace(/^"/, '');
    temp = temp.replace(/"$/, '');
    temp = temp.replace(/\\n/gm, '\n');
    return temp;
  } else {
    return '';
  }
};

/**
 * Query to restrieve only request values and export in key value pair
 * @param {*} requestId
 * @returns
 * currently handled by getRequestDataArray (remove if not needed to sunrise resignation flow)
 */
const getRequestData = async (requestId) => {
  const result = (
    await db.query(`select rv.* from requests r
  join request_values rv on rv.requestId = r.id where r.id = ${requestId}`)
  )[0];
  const data = {};
  for (let i = 0; i < result.length; i++) {
    if (result[i].value) {
      data[result[i].name] = sanitizeTemplate(result[i].value);
    } else {
      data[result[i].name] = '';
    }
  }
  return data;
};

const getFormDetail = async (requestId) => {
  let result = (
    await db.query(`SELECT r.requestKey AS requestId
    ,f.name AS form
    ,f.formData AS formData
    ,f.type AS formType
    ,c.name AS category
    ,r.createdAt AS requestDate
    ,r.requestedBranch AS requestedBranch
    ,r.statusId AS reqStatus
    ,r.updatedAt AS finalDate
  FROM requests r
  JOIN forms f ON f.id = r.formId
  JOIN categories c ON c.id = f.categoryId
  WHERE r.id = ${requestId}`)
  )[0][0];
  let date = new Date(result.requestDate);
  let newDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
  result = { ...result, requestDate: newDate };

  date = new Date(result.finalDate);
  newDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
  result = { ...result, finalDate: newDate };

  return result;
};

/**
 * Query to restrieve only request values and export in key value pair
 * @param {*} requestId
 * @returns
 */
const getRequestDataArray = async (requestId, formFields) => {
  const result = (
    await db.query(`select rv.* from requests r
  join request_values rv on rv.requestId = r.id where r.id = ${requestId}`)
  )[0];
  const data = {};
  for (let i = 0; i < result.length; i++) {
    const decodeValue = result[i].value;
    if (result[i].type == 'text') {
      //filter incase of radiobox and checkbox
      if (Array.isArray(JSON.parse(decodeValue))) {
        data[result[i].label] = filterRadioValue(JSON.parse(decodeValue), result[i].name, formFields);
      } else {
        data[result[i].label] = sanitizeTemplate(decodeValue);
      }
    }
    //filter incase of file
    else if (result[i].type == 'file') {
      data[result[i].label] = sanitizeFile(decodeValue);
    }
  }

  let values = [];
  Object.entries(data).forEach((entry) => {
    const [key, value] = entry;
    values.push({ column: key, value: value || '  ' });
  });
  return values;
};

const sanitizeFile = (fileDetails) => {
  let file = JSON.parse(fileDetails);
  return `Filename: ${file.filename}, Size: ${file.size} KB`;
};

//Filter request data in case of radio button value
const filterRadioValue = (data, title, formData) => {
  let value;
  const fieldObject = _.find(formData, { field_name: title });
  if (Array.isArray(data)) {
    let values = [];
    data.map((item) => {
      const radioValue = _.find(fieldObject.options || [], { key: item });
      values.push(radioValue.text);
      return true;
    });
    values = values.join(', ');
    value = values;
  } else {
    value = sanitizeTemplate(data);
  }
  return value;
};
/**
 * Getting sub form details (key value pair with subform id)
 * @param {*} req
 * @param {*} res
 */
const getSubRequestValue = async (requestId) => {
  const result = (
    await db.query(`select subformId, srv.* from sub_requests sr 
    join sub_request_values srv
    on sr.id = srv.subRequestId
    where sr.requestId = ${requestId}
    order by sr.updatedAt asc`)
  )[0];

  const data = {};
  const subData = {};
  for (let i = 0; i < result.length; i++) {
    if (result[i].name.includes('date')) {
      //filtering date to generate LC-BG Draft formatted date
      let dateValue = sanitizeTemplate(result[i].value);
      let dateformat = {};
      if (dateValue) {
        let now = new Date(dateValue);
        const day = ('0' + now.getDate()).slice(-2);
        const month = ('0' + (now.getMonth() + 1)).slice(-2);
        const year = now.getFullYear().toString().slice(-2);
        let formattedValue = year + month + day;
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedBG = now.toLocaleDateString('en-US', options);
        dateformat = { default: dateValue, formatted: formattedValue, formattedissueDateBG: formattedBG };
      }
      subData[result[i].name] = dateformat;
      data[result[i].subformId] = subData;
    } else {
      if (result[i].value && result[i].value.includes('%')) {
        subData[result[i].name] = sanitizeTemplate(result[i].value);
      } else {
        subData[result[i].name] = sanitizeTemplate(result[i].value);
      }
      data[result[i].subformId] = subData;
    }

    if (result[i].name === 'validityDate') {
      let formatValidity = new Date(result[i].value);
      var options = { year: 'numeric', month: 'long', day: 'numeric' };
      const validityDate = formatValidity.toLocaleDateString('en-US', options);
      subData[result[i].name] = validityDate;
      data[result[i].subformId] = subData;
    }
    if (result[i].name === 'claim_validity') {
      let formatClaimValidity = new Date(result[i].value);
      var options = { year: 'numeric', month: 'long', day: 'numeric' };
      const claim_validity = formatClaimValidity.toLocaleDateString('en-US', options);
      subData[result[i].name] = claim_validity;
      data[result[i].subformId] = subData;
    }
  }

  return data;
};

/**
 * Retrieve request initiator details
 * @param {*} req
 * @param {*} res
 */

const getRequestInitiator = async (requestId) => {
  const initiator = (
    await db.query(`select r.requestSenderId, r.requestSenderType from forms f
  join requests r
  on r.formId = f.id
  where r.id = ${requestId}`)
  )[0][0];

  let initiatorDetail = {};
  if (initiator && initiator.requestSenderType == 'customer') {
    const detail = (await db.query(`select * from customers where id = ${initiator.requestSenderId}`))[0][0];
    initiatorDetail = {
      id: detail.id,
      name: detail.accountName,
      email: detail.email,
      phone: detail.mobileNumber,
      account: detail.accountNumber,
    };
  } else if (initiator && initiator.requestSenderType == 'user') {
    const detail = (await db.query(`select * from users where id = ${initiator.requestSenderId}`))[0][0];

    initiatorDetail = {
      id: detail.id,
      name: detail.name,
      email: detail.email,
      phone: '',
      account: '',
    };
  }
  return initiatorDetail;
};

const printPDF = async (html, options) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\BPA\\bpa 1.0.0\\chrome-win\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf(options);
    await page.emulateMediaType('screen');
    await browser.close();

    return pdf;
  } catch (error) {
    // this.logger.debug(error);
    console.log(error);
  }
};

/**
 * Generates a pdf and sends for download.
 *
 * @param {*} name
 * @param {*} request
 * @param {*} template
 * @returns
 */
const generatePdf = async (name, request, template, action) => {
  const fileName = `${name}.pdf`;
  let templateFooter = `<div></div>`;
  if (
    template.type == 'Advance Payment' ||
    template.type == 'Bid Bond' ||
    template.type == 'Custom Guarantee' ||
    template.type == 'Line of Credit Commitment' ||
    template.type == 'Performance Bond' ||
    template.type == 'Supply Credit Guarantee'
  ) {
    templateFooter = `<div style="font-family: 'Times New Roman', Times, serif; font-size: 10px; text-align: center; width: 100%; margin-bottom:20mm">This Bank Guarantee can be verified at our website www.globalimebank.com</div>`;
  }
  const options = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: '32mm',
      bottom: '22mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: templateFooter,
    path: `./temp/${fileName}`,
  };

  let templateData = template.fields;
  templateData = templateData.toString().replace(/\\n/g, ' ').replace(/\\/g, '') || '';
  templateData = sanitizeTemplate(templateData);
  templateData = decode(templateData, { level: 'html5' });
  Handlebars.registerHelper('ifEquals', function (value, testValue, options) {
    if (value === testValue) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  if ((template.name == 'MT-700 Expanded' || template.name == 'Approver Log Timeline') && action == 'download') {
    function replaceBR(text) {
      if (typeof text == 'string') {
        return text.replace(/\n/g, '<br/>');
      }
    }
    const changeObject = {
      description_of_good: replaceBR(request?.subform[1]?.description_of_good || ''),
      additional_conditions: replaceBR(request?.subform[1]?.additional_conditions || ''),
      instruction_to_pay: replaceBR(request?.subform[1]?.instruction_to_pay || ''),
      documents_required: replaceBR(request?.subform[1]?.documents_required || ''),
    };
    request = { ...request, subform: { ...request.subform, 1: { ...request.subform[1], ...changeObject } } };
  } else if (action == 'download' && request.subform[2]?.beneficiary_name) {
    request = {
      ...request,
      subform: {
        ...request.subform,
        2: { ...request.subform[2], ...{ beneficiary_name: request?.subform[2]?.beneficiary_name.replace(/\n/g, '<br/>') } },
      },
    };
  }

  const temp = Handlebars.compile(sanitizeTemplate(templateData));
  templateData = temp(request);
  if (template.name == 'MT-700 Expanded' || template.name == 'Approver Log Timeline') {
    templateData = templateData.toUpperCase();
  }
  if (action == 'view') {
    return templateData || 'Empty';
  } else if (action == 'download') {
    const document = {
      html: templateData.replace(/\&LT;/g, '<').replace(/\&GT;/g, '>').replace(/\&lt;/g, '<').replace(/\&gt;/g, '>'),
      path: `./temp/${fileName}`,
      data: {},
      type: '',
    };

    const data = await printPDF(document.html, options);

    // const data = await pdf.create(document, options);
    // console.log('====TEMPLATE GENERATE', document, data.filename, '====================');a
    if (data) {
      const fileData = {
        file: `./temp/${fileName}`,
        filename: fileName,
        originalName: fileName,
        path: fileName,
        mimeType: path.extname(`./temp/${fileName}`),
        size: fs.statSync(`./temp/${fileName}`).size,
      };

      console.log(fileData, '=====data');

      return fileData;
    }
  }
};

/**
 * Generates a text file.
 *
 * @param name
 * @param request
 * @param template
 * @returns {Promise<{file: string, filename: string}>}
 */
const generateTextFile = async (name, request, template, action) => {
  const fileName = `${name}.txt`;
  const filePath = path.resolve(__dirname, '../../temp', fileName);
  Handlebars.registerHelper('ifEquals', function (value, testValue, options) {
    if (value === testValue) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  const temp = Handlebars.compile(sanitizeTemplate(template.fields));
  let data = temp(request);
  if (template.name == 'MT-700 Non-Expanded') {
    data = data
      .replace(/&#x27;/g, "'")
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"');
  }
  if (action == 'view') {
    return data.toUpperCase() || 'Empty';
  } else if (action == 'download') {
    try {
      fs.appendFileSync(filePath, data.toUpperCase());
    } catch (e) {
      // TODO: Handle failure gracefully.
    }
    const fileData = {
      file: filePath,
      filename: fileName,
      originalName: fileName,
      path: fileName,
      mimeType: path.extname(filePath),
      size: fs.statSync(filePath).size,
    };
    return fileData;
  }
};

/**
 * Returns file data based on export type.
 *
 * @param {*} request
 * @param {*} template
 * @returns
 */
const generateFile = (request, template, action, swiftMail, LcNum = '') => {
  switch (template.output) {
    case 'TXT':
      if (swiftMail) {
        return generateTextFile(LcNum + `_${template.name}`, request, template, action);
      } else {
        return generateTextFile(uuidv4(), request, template, action);
      }
    default:
      // Generates a pdf by default.
      if (swiftMail) {
        return generatePdf(LcNum + `_${template.name}`, request, template, action);
      } else {
        return generatePdf(uuidv4(), request, template, action);
      }
  }
};

const getPrintRequest = async (req, res) => {
  const requestId = req.params.id;
  await requestRepository
    .getPrintRequest(requestId)
    .then((template) => {
      return respond(res, httpStatus.OK, 'Get print templates', template);
    })
    .catch((err) => {
      console.log(err);
      return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Error!!');
    });
};

/**
 *  LOG detail for download
 */
const getLogDetail = async (requestId) => {
  const log = (
    await db.query(`select wl.* from workflow_logs wl
  join requests r
  on r.id = wl.requestId
  where r.id = ${requestId}`)
  )[0];

  let logDetail = [];
  let action = '';
  for (let i = 0; i < log.length; i++) {
    switch (Number(log[i].actionId)) {
      // case actions.Return:
      //   action = 'Rejected';
      //   break;
      case actions.Approve:
        action = 'Approved';
        break;
      default:
        action = '';
    }
    if (action != '') {
      let user = await userRepository.find(log[i].currentUserId);
      let group = await groupRepository.find(log[i].groupId);
      let comment = log[i].comment;
      let date = moment(log[i].createdAt).format('MMM DD h:mm A');
      // const finaldate = new Date(date).toUTCString().split(' ').slice(0, 5).join(' ');
      if (comment != null) {
        comment = comment.replace(/<[^>]+>/g, '').replace(/\n/g, '');
      }
      logDetail.push({ group: group?.name, name: user?.name, action: action, comment: comment, date: date });
    }
  }
  return logDetail;
};

/**
 * Generated request document for download
 * @param {*} req
 * @param {*} res
 */
const generateRequestDocument = async (req, res) => {
  const { requestId } = req.params;
  const { templateId } = req.params;
  const { action } = req.query;

  const form = await getFormDetail(requestId);
  let formFields;
  // check for formDetails
  if (form.formType === 'dynamic') {
    let formData = JSON.parse(form.formData);
    formData.map((item) => {
      if (item.hasOwnProperty('field_name')) {
        item.field_name = item.field_name.replace(/-/g, '_');
        return true;
      }
      return false;
    });
    formFields = formData;
  }
  const main = await getRequestData(requestId);
  const subrequests = await getSubRequestValue(requestId);
  const initiator = await getRequestInitiator(requestId);
  const log = await getLogDetail(requestId);
  const allRequest = await getRequestDataArray(requestId, formFields);
  const request = {
    main,
    subform: subrequests,
    initiator,
    log,
    form,
    allRequest,
  };
  const template = await getTemplateData(templateId);
  const files = await generateFile(request, template, action);
  if (files && action == 'view') {
    return res.json(files);
  } else if (files && action == 'download') {
    return res.download(files.file, files.filename);
  }
};

const generateRequestDocumentEdited = async (req, res) => {
  const name = uuidv4();
  let template = req.body.template;
  const fileName = `${name}.pdf`;
  const options = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: '32mm',
      bottom: '22mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="font-family: 'Times New Roman', Times, serif; font-size: 10px; text-align: center; width: 100%; margin-bottom:20mm">This Bank Guarantee can be verified at our website www.globalimebank.com</div>`,
    path: `./temp/${fileName}`,
  };
  template = decode(template, { level: 'html5' });

  const document = {
    html: template,
    path: `./temp/${fileName}`,
    data: {},
    type: '',
  };
  const data = await printPDF(document.html, options);

  if (data) {
    const fileData = {
      file: `./temp/${fileName}`,
      filename: fileName,
      originalName: fileName,
      path: fileName,
      mimeType: path.extname(`./temp/${fileName}`),
      size: fs.statSync(`./temp/${fileName}`).size,
    };

    return res.json({ file: fileData.file, filename: fileData.filename });
  }
};

const handleSendMail = async (req, res) => {
  const { templateIds } = req.body;
  const requestId = req.params.requestId;
  const { user } = req.body;
  const groupId = await requestRepository.findUserGroup(requestId, user);

  const form = await getFormDetail(requestId);
  let formFields;
  if (form.formType === 'dynamic') {
    let formData = JSON.parse(form.formData);
    formData.map((item) => {
      if (item.hasOwnProperty('field_name')) {
        item.field_name = item.field_name.replace(/-/g, '_');
        return true;
      }
      return false;
    });
    formFields = formData;
  }
  const main = await getRequestData(requestId);
  const subrequests = await getSubRequestValue(requestId);
  const initiator = await getRequestInitiator(requestId);
  const log = await getLogDetail(requestId);
  const allRequest = await getRequestDataArray(requestId, formFields);
  const request = {
    main,
    subform: subrequests,
    initiator,
    log,
    form,
    allRequest,
  };
  let filesTemp = [];
  for (let i = 0; i < templateIds.length; i++) {
    const template = await getTemplateData(templateIds[i]);
    if (template.name != 'MT-700 Expanded') {
      const files = await generateFile(request, template, 'download', true, request.subform['1']?.documentary_credit_number);
      filesTemp.push(files);
    }
  }
  const data = await sendMessageTemp(filesTemp, request.subform['1']?.documentary_credit_number || '');
  await writeToLog(requestId, '10', groupId, null, user, 'Mail sent to swift', filesTemp);
  return respond(res, httpStatus.OK, 'Mail Send Successfully', null);
};

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
    uploadAttachments(files);
    files.map(async (file) => {
      // below line will upload file to dms
      // const uploadedFileInfo = await uploadToDMS(requestKey, [file]);
      const fileInfo = {
        workflowLogId: log.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
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

const countRequest = async (req, res) => {
  const tab = req.params.id;
  const user = req.user.id;
  let query = readFileSync(resolve(__dirname, '../sql/dashboardRequest.sql')).toString();
  query = query.replace(/\s+/g, ' ');
  query = query.replace(/:user/g, user);
  switch (tab) {
    case 2:
      query = query.replace(/:status/g, 'Forwarded');
      break;
    case 4:
      query = query.replace(/:status/g, 'Approved');
      break;
    case 3:
      query = query.replace(/:status/g, 'Returned');
      break;
    default:
      query = query.replace(/:status/g, 'Pending');
      break;
  }
  return db.query(query);
};
const getRemainingValues = async (id) => {
  let query1 = `SELECT * from sub_request_values srv 
  join sub_requests sr on srv.subRequestId  = sr.id 
  join requests r on r.id = sr.requestId and r.id = ${id} 
  where sr.id = (SELECT Top 1 id from sub_requests sr2 where sr2.requestId = ${id} order by updatedAt desc)`;
  const result = (await db.query(query1))[0];
  let formatData = formatHTMLRequestLabels(result);
  return formatData[0];
};

const formatBGtype = async (data) => {
  let formatedData = formatHTMLRequestLabels(data);
  let finalData = [];
  for (let i = 0; i < formatedData.length; i++) {
    const newData = {};
    newData['id'] = formatedData[i]?.id;
    newData['statusId'] = formatedData[i]?.statusId;
    newData['Date'] = formatedData[i]?.createdAt;
    newData['Sol Id'] = formatedData[i]?.requestedBranch;
    const remainingData = await getRemainingValues(formatedData[i].id);
    remainingData
      ? (newData['Reference Number'] = remainingData['Reference Number'] ? remainingData['Reference Number'] : '')
      : newData['Reference Number'];
    newData['Branch Name'] = formatedData[i]?.branchName;
    newData['Applicant Name'] = formatedData[i]['Individual/Company/Firm Name'];
    newData['Beneficiary Name'] = formatedData[i]['Beneficiary Name'];
    newData['CCY'] = formatedData[i]['Currency'];
    newData['Amount'] = formatedData[i]['Currency Amount'];
    remainingData
      ? (newData['Validity Period'] = remainingData['Validity Date'] ? remainingData['Validity Date'] : '')
      : (newData['Validity Period'] = '');
    remainingData
      ? (newData['Margin Amount'] = remainingData['Margin Amount'] ? remainingData['Margin Amount'] : '')
      : (newData['Margin Amount'] = '');
    remainingData
      ? (newData['Commission'] = remainingData['Commission Amount'] ? remainingData['Commission Amount'] : '')
      : (newData['Commission'] = '');

    finalData.push(newData);
  }
  return finalData;
};

const getBgData = async (req, res) => {
  const bgDataSet = await getBgDataSet();
  const formattedBGData = await formatBGtype(bgDataSet);
  return respond(res, httpStatus.OK, 'SUCCESS', formattedBGData);
};
const exportExcel = async (req, res) => {
  const startDate = dateYMD(req.query.startDate);
  const endDate = dateYMD(req.query.endDate);
  const requestLabel = await filterRequestLabel(req.query.formId);
  const dataset = await filterRequest(req.query.formId, startDate, endDate, req.query.status);
  let requestLabels;

  // Defining styles as json object
  const styles = {
    headerDark: {
      font: {
        bold: true,
      },
    },
  };
  let specs = {};
  let finalData = [];

  //Formatting request label and values
  if (req.query.formId == 2 || req.query.formId == 4) {
    finalData = await formatBGtype(dataset);
    const keys = finalData.length > 0 ? Object.keys(finalData[0]) : [];
    for (let i = 0; i < keys.length; i++) {
      specs[keys[i]] = {
        displayName: keys[i] ? keys[i] : 'Label',
        width: 200,
        headerStyle: styles.headerDark,
      };
    }
  } else if (requestLabel.length > 0 && requestLabel[0].type == 'html') {
    finalData = formatHTMLRequestLabels(dataset);
    const keys = finalData.length > 0 ? Object.keys(finalData[0]) : [];
    for (let i = 0; i < keys.length; i++) {
      specs[keys[i]] = {
        displayName: keys[i] ? keys[i] : 'Label',
        width: 200,
        headerStyle: styles.headerDark,
      };
    }
  } else {
    requestLabels = formatRequestLabels(requestLabel[0].formData, dataset);
    specs = {
      id: {
        displayName: 'Request ID',
        width: 75,
        headerStyle: styles.headerDark,
      },
      createdAt: {
        displayName: 'Created At',
        width: 75,
        headerStyle: styles.headerDark,
      },
    };

    //loop over requestLabels and add the labels between id and createdAt
    for (let i = 0; i < requestLabels.total; i++) {
      specs[requestLabels.title[i]] = {
        displayName: requestLabels.title[i] ? requestLabels.title[i] : 'Label',
        width: 200,
        headerStyle: styles.headerDark,
      };
    }

    for (let i = 0; i < requestLabels.value.length / requestLabels.total; i++) {
      let dataObj = {};
      for (let j = 0; j < requestLabels.total; j++) {
        dataObj[requestLabels.title[j]] = requestLabels.value[j + requestLabels.total * i];
      }
      dataObj['id'] = dataset[i * requestLabels.total].id;
      dataObj['createdAt'] = dataset[i * requestLabels.total].createdAt;
      finalData.push(dataObj);
    }
  }

  // Create the excel report. This function will return Buffer
  const report = excel.buildExport([
    {
      name: 'Report',
      specification: specs,
      data: finalData,
    },
  ]);
  const fileName = uuidv4() + '.xlsx';
  const filePath = path.resolve(__dirname, '../../temp', fileName);

  fs.writeFile(filePath, new Buffer(report, 'binary'), (err) => {
    if (err) {
      res.send('Error while downloading request file!');
    } else {
      return res.download(filePath, fileName);
    }
  });
};

const formatHTMLRequestLabels = (data) => {
  let allLabelsWithoutDuplicate = new Set();
  let ids = new Set();
  data?.forEach((item) => {
    allLabelsWithoutDuplicate.add(item.label);
    ids.add(item.id);
  });
  let allLabels = Array.from(allLabelsWithoutDuplicate);
  let allIds = Array.from(ids);
  let finalData = [];
  for (let i = 0; i < allIds.length; i++) {
    const filteredData = data.filter((item) => item.id == allIds[i]);
    const filteredLabels = filteredData.map((item) => item.label);
    const notFoundLabel = allLabels.filter((item) => !filteredLabels.includes(item));
    const newData = {};
    for (let j = 0; j < filteredData.length; j++) {
      if (!newData['id']) {
        newData['id'] = filteredData[j].id;
        newData['requestedBranch'] = filteredData[j].requestedBranch;
        newData['createdAt'] = filteredData[j].createdAt;
        newData['statusId'] = filteredData[j]?.statusId;
        newData['branchName'] = filteredData[j]?.branchName;
      }

      newData[filteredData[j].label] = filteredData[j].value;
    }

    for (let k = 0; k < notFoundLabel.length; k++) {
      newData[notFoundLabel[k]] = '';
    }
    finalData.push(newData);
  }

  return finalData;
};

//Formatting request labels and values as done in request view
const formatRequestLabels = (formDatas, fullRow) => {
  let value;
  let title;
  let reqData = [];
  let reqTitle = [];
  let formData = JSON.parse(formDatas);

  /**
   * Replacing all - with underscore as it was giving problems during
   * object filter while extracting values.
   */
  formData.map((item) => {
    if (item.hasOwnProperty('field_name')) {
      item.field_name = item.field_name.replace('-', '_');
      return true;
    }
    return false;
  });

  fullRow.map((rowItem) => {
    const formValue = JSON.parse(rowItem.value);
    const fieldObject = _.find(formData, (data) => {
      return data.field_name === rowItem.name;
    });
    if (Array.isArray(formValue)) {
      let values = [];
      formValue.map((item) => {
        const radioValue = _.find(fieldObject.options || [], { key: item });
        values.push(radioValue.text);
        return true;
      });
      values = values.join(', ');
      title = fieldObject?.label;
      value = values;
    } else {
      value = formValue;
      title = fieldObject?.label;
    }
    if (value) {
      value = value.replace('\\n', ' ');
      value = value.replace('false', 'No');
      value = value.replace('true', 'Yes');
    }
    reqData.push(value);
    reqTitle.push(title);
  });
  return { value: reqData, title: reqTitle, total: formData.length };
};

// Get date in YYYY-MM-DD excluding time
const dateYMD = (dates) => {
  const date = new Date(dates);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const dt = date.getDate();

  return year + '-' + month + '-' + dt;
};

// Query to filter all the request labels group by request ID
const filterRequestLabel = async (formId) => {
  let query = `select formData, type from forms where id = ${formId}`;
  return (await db.query(query))[0];
};

// Query to filter all the request values with date, form and status
const filterRequest = async (formId, startDate, endDate, status) => {
  let query = `select r.id, r.createdAt, r.requestedBranch, rv.name, rv.label, rv.value from requests r
  join request_values rv on r.id = rv.requestId where r.formId = ${formId} and r.createdAt between '${startDate}' and '${endDate}'`;
  if (status && status > 0) {
    query = query + ` and r.statusId = ${status}`;
  }
  return (await db.query(query))[0];
};
const getBgDataSet = async () => {
  let query = `select r.id, r.createdAt, r.requestedBranch ,r.statusId, rv.name, rv.label, rv.value, b.name as branchName from requests r
  join request_values rv on r.id = rv.requestId
  join branches b on r.requestedBranch = b.sol  where r.formId in (2,4)`;
  return (await db.query(query))[0];
};

// Creating random string for
const internalRequest = async (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const user = req.user.id;
  const key = `access-token-${user}`;
  await redis.set(key, await argon2.hash(token));
  await redis.expire(key, 120);
  return respond(res, httpStatus.OK, null, token);
};

// handling the customer token and sending jwt on response
const handleToken = async (req, res) => {
  const reqToken = req.query.access;
  const user = req.query.j;
  let jwt = '';
  const verified = await verifyToken(user, reqToken);
  if (verified) {
    await redis.del(`access-token-${user}`);
    jwt = await userService.generateTokens(user, true);
    return respond(res, httpStatus.OK, null, jwt);
  }
  return respond(res, httpStatus.UNAUTHORIZED, null, null);
};

//Verifying token from the customer portal to authenticate bank user
const verifyToken = async (user, reqToken) => {
  const redisGet = promisify(redis.get).bind(redis);
  const value = await redisGet(`access-token-${user}`);
  if (!value) {
    return false;
  }
  return await argon2.verify(value, reqToken);
};

const populate = async (req, res) => {
  const id = req.params.id;

  const final = await RequestValue.findAll({ where: { requestId: id } });
  let obj = {};
  final.forEach((request) => {
    if (request.value) {
      obj = {
        ...obj,
        [request.name]: request.value.replace(/["]+/g, ''),
      };
    }
  });
  const request = await Request.findOne({ where: { id } });
  obj['db_requestBranch'] = request?.requestedBranch;
  obj['request'] = id;
  if (request && request.requestSenderType == 'customer') {
    const customerId = request.requestSenderId;
    const user = await Customer.findOne({ where: { id: customerId } });
    obj['customer_name'] = user.accountName;
    obj['customer_account'] = user.accountNumber;
  }
  res.send(obj);
};

const VerifyRequestItems = async (req, res) => {
  const { id, item } = req.query;
  const verified = await requestRepository.verifyRequest(id, item);
  if (verified) {
    return respond(res, httpStatus.OK, verified.message, verified.result);
  }
  return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Verification failed', null);
};

const ViewNotifications = async (req, res) => {
  const { id, solId, permissions } = req.user;
  let singleBranch = 'false';
  if (permissions?.length > 0 && permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const { query } = bucketRequestQuery('user', id, 0, 50, '', '', '', solId, singleBranch);
  const data = await db.query(query);
  return respond(res, httpStatus.OK, 'Notifications', data[0]);
};

const getBiBiniList = async (req, res) => {
  const userId = req.user.id;
  let singleBranch = 'false';
  if (req.user?.permissions?.length > 0 && req.user.permissions.includes('view-self-branch-requests')) {
    singleBranch = 'true';
  }
  const { page, pageSize } = req.query;
  const { limit, offset } = getPagination(page, pageSize);

  let search = '';
  if (req.query?.search) {
    let filterQuery = '';
    search = JSON.parse(req.query.search);
    for (const filter of search) {
      switch (filter.operator) {
        case 'equals':
          filterQuery += ` AND (${filter?.field} = '${filter?.value}')`;
          break;
        case 'like':
          filterQuery += ` AND (${filter?.field} LIKE '%${filter?.value}%')`;
          break;
        case 'starts-with':
          filterQuery += ` AND (${filter?.field} LIKE '${filter?.value}%')`;
          break;
        case 'ends-with':
          filterQuery += ` AND (${filter?.field} LIKE '%${filter?.value}')`;
          break;
        case 'date-range':
          const startDate = filter?.value;
          const endDate = filter?.value2;
          filterQuery += ` AND (${filter?.field} BETWEEN '${startDate}' AND '${endDate}')`;
          break;
        default:
          break;
      }
    }
    search = filterQuery;
  }

  const queryData = `SELECT a.* FROM 
                    (SELECT r.id AS rId, r.requestKey AS requestKey, f.name AS form, u.name AS username, r.identifier AS copy, r.statusId AS status, r.requestedBranch AS branch, r.createdAt AS createdDate, wl.createdAt AS voidDate, u2.name AS voidUser
                      FROM requests r 
                      JOIN forms f ON f.id = r.formId 
                      JOIN users u ON u.id = r.requestSenderId AND r.requestSenderType = 'user'
                      LEFT JOIN workflow_logs wl ON wl.requestId = r.id AND wl.actionId = 8
                      LEFT JOIN users u2 ON u2.id = wl.currentUserId) as a
                    WHERE a.form LIKE 'BIBINI%' ${search ? `${search}` : ''}
                    ORDER BY a.createdDate DESC OFFSET ${offset} ROWS
                    FETCH NEXT ${limit} ROWS ONLY`;

  const queryCount = `SELECT COUNT(*) AS totalCount FROM 
                      (SELECT r.id AS rId, r.requestKey AS requestKey, f.name AS form, u.name AS username, r.identifier AS copy, r.statusId AS status, r.requestedBranch AS branch, r.createdAt AS createdDate
                        FROM requests r 
                        JOIN forms f ON f.id = r.formId 
                        JOIN users u ON u.id = r.requestSenderId AND r.requestSenderType = 'user') as a
                      WHERE a.form LIKE 'BIBINI%' ${search ? `${search}` : ''}`;
  const bibiniData = await db.query(queryData);
  const bibiniCount = await db.query(queryCount);
  const requestData = getPagingData({ rows: bibiniData[0], count: bibiniCount[0][0].totalCount }, page, limit, offset);
  return respond(res, httpStatus.OK, 'Bibini request fetched successfully.', requestData);
};

module.exports = {
  all,
  single,
  action,
  store,
  getAvailableActions,
  viewCustomerFile,
  getReferGroups,
  getSubform,
  storeSub,
  getReturnGroups,
  getPrintRequest,
  generateRequestDocument,
  countRequest,
  getRequestsCount,
  exportExcel,
  internalRequest,
  handleToken,
  populate,
  VerifyRequestItems,
  ViewNotifications,
  formatBGtype,
  getBgData,
  getInternalCount,
  handleSendMail,
  generateRequestDocumentEdited,
  downloadTemplateFile,
  getBiBiniList,
  getCorporateInternalCount,
  getCorporateExternalCount,
  getAllRequestsCount,
};
