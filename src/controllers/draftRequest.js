const { DraftRequest, DraftRequestValue, Form } = require('../models');
const { HTTP, Status } = require('../constants/response');
const argon2 = require('argon2');
const moment = require('moment'); // require
const { Op } = require('sequelize');
const { draftRequestRepository } = require('../repositories');
// const { sendNewRequestEmail } = require('../utils/request');
// const { generateAuthCode } = require('../utils/request');
const { respond } = require('../utils/response');
const { draftRequestService } = require('../services');
const httpStatus = require('http-status');

const generateRequestKey = async () => {
  const DraftRequestCount = await DraftRequest.findAndCountAll({
    where: {
      createdAt: {
        [Op.gte]: moment().startOf('day').toISOString(),
        [Op.lte]: moment().endOf('day').toISOString(),
      },
    },
  });
  return `BPA-${Math.round(new Date().getTime() / 1000)}-${DraftRequestCount.count + 1}`;
};

/**
 * Post Draft Request Sent by Client.
 */
const store = async (req, res) => {
  const formId = req.body.formId;
  const statusId = req.body.statusId;
  const isDraft = req.body.isDraft;
  const isDynamic = req.body.isDynamic ? req.body.isDynamic : null;
  const requestSenderId = req.body.requestSenderId; //TODO: get requestSenderId from customer or user.
  const requestSenderType = 'user';
  let requestValues = req.body.requestValues;
  let fileList = [];
  if (isDynamic) {
    requestValues = JSON.parse(req.body.requestValues);
    if (req.body.fileList) {
      fileList = JSON.parse(req.body.fileList);
    }
  }
  try {
    const request = {
      formId,
      statusId,
      requestSenderId,
      requestSenderType,
      isDraft,
    };
    request['key'] = await generateRequestKey();
    // const authCode = await generateAuthCode();
    // request['authCode'] = await argon2.hash(authCode);

    DraftRequest.create(request).then(async (request) => {
      await Promise.all([
        ...requestValues.map((requestValue) => {
          //TODO: change type based on form-builder type.
          const insertRequestValue = {
            formId,
            draftRequestId: request.id,
            name: requestValue.name,
            value: JSON.stringify(requestValue.value),
          };
          if (requestValue.name.includes('fileupload')) {
            const fileField = fileList.find((x) => x.fieldName === requestValue.name);
            if (fileField) {
              insertRequestValue['type'] = 'file';
              insertRequestValue['label'] = fileField.label ? fileField.label : requestValue.name;
              insertRequestValue['value'] = JSON.stringify(req.files.find((x) => x.fieldname === requestValue.name));
              return DraftRequestValue.create(insertRequestValue);
            }
            return null;
          } else {
            insertRequestValue['type'] = 'text';
            insertRequestValue['label'] = requestValue.label ? requestValue.label : requestValue.name;
            return DraftRequestValue.create(insertRequestValue);
          }
        }),
      ]);
      // await sendNewRequestEmail(request, authCode);
      return respond(res, HTTP.StatusOk, 'New request submitted successfully.');
    });
  } catch (e) {
    return respond(res, HTTP.StatusInternalServerError, 'Failed to create new request.');
  }
};

const allDrafts = async (req, res) => {
  let request;
  let message;

  // TODO: get customer id from authentication token
  const userId = 1;

  // TODO: validate if the status id is valid and exists in the status list
  // TODO: validate if page number and limit are instance of unsigned integer

  try {
    DraftRequest.belongsTo(Form);
    request = await DraftRequest.findAll({
      where: {
        requestSenderId: userId,
        requestSenderType: 'user',
        isDeleted: false,
      },
      attributes: ['id', 'statusId', 'createdAt', 'requestSenderId', 'requestSenderType'],
      include: [
        {
          model: Form,
          required: true,
          attributes: ['name'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  } catch (e) {
    res.status(HTTP.StatusInternalServerError).json({
      status: Status.Failed,
      message: 'Failed to fetch Request.',
      data: null,
    });
  }
  if (request !== null) {
    message = 'Fetched all requests.';
  } else {
    message = 'No requests were found.';
  }
  res.status(HTTP.StatusOk).json({
    status: Status.Success,
    message: message,
    data: request || null,
  });
};

const getDraftById = async (req, res) => {
  let { id, key, authCode } = req.query;
  DraftRequest.hasOne(Form, { sourceKey: 'formId', foreignKey: 'id' });
  DraftRequest.hasMany(DraftRequestValue, {
    sourceKey: 'id',
    foreignKey: 'draftRequestId',
  });
  try {
    let findOne = await DraftRequest.findOne({
      where: {
        id,
      },
      attributes: [],
      include: [
        {
          model: Form,
          attributes: ['id', 'name', 'type', 'formData'],
          required: true,
        },
        {
          model: DraftRequestValue,
          attributes: ['name', 'value'],
          required: true,
        },
      ],
    });
    res.status(HTTP.StatusOk).json({
      status: Status.Success,
      message: 'Fetched Request Data.',
      data: findOne,
    });
  } catch (e) {
    res.status(HTTP.StatusInternalServerError).json({
      status: Status.Failed,
      message: 'Auth Code and Key Empty',
      data: null,
    });
  }
};

const getDraftByAuthIdAndKey = async (req, res) => {
  const id = req.params.id;
  let requestById;
  DraftRequest.hasOne(Form, { sourceKey: 'formId', foreignKey: 'id' });
  DraftRequest.hasMany(DraftRequestValue, {
    sourceKey: 'id',
    foreignKey: 'draftRequestId',
  });
  try {
    requestById = await DraftRequest.findOne({
      where: {
        id: id,
      },
      attributes: [],
      include: [
        {
          model: Form,
          attributes: ['id', 'name', 'type', 'formData'],
          required: true,
        },
        {
          model: DraftRequestValue,
          attributes: ['name', 'value'],
          required: true,
        },
      ],
    });
    // if no form by Id return 404
    if (requestById === null) {
      res.status(HTTP.StatusNotFound).json({
        status: Status.Failed,
        message: 'Request Not found.',
        data: null,
      });
    } else {
      res.status(HTTP.StatusOk).json({
        status: Status.Success,
        message: 'Fetched Request data.',
        data: requestById,
      });
    }
  } catch (e) {
    res.status(HTTP.StatusInternalServerError).json({
      status: Status.Failed,
      message: 'Failed to fetch Request Data.',
      data: null,
    });
  }
};

const editDraft = async (req, res) => {
  const requestValues = req.body.data.requestValues;
  const requestId = req.body.data.id;
  // TODO: Implement transaction here.
  // try {
  //   return await connection.transaction(async (t) => {
  //     await DraftRequestValue.destroy({ where: { draftRequestId: requestId }, transaction: t });
  //     requestValues.map(async (item) => {
  //       await DraftRequestValue.create(
  //         {
  //           draftRequestId: requestId,
  //           name: item.name,
  //           value: JSON.stringify(item.value),
  //           label: item.name,
  //           type: 'text',
  //         },
  //         { transaction: t }
  //       );
  //     });
  //     return res.status(200).send({ message: 'Success' });
  //   });
  // } catch (err) {
  //   res.status(500).send({ message: 'Error!!' });
  // }
  await Promise.all([
    DraftRequestValue.destroy({ where: { draftRequestId: requestId } }),
    requestValues.map(async (item) => {
      return Promise.all([
        DraftRequestValue.create({
          draftRequestId: requestId,
          name: item.name,
          value: JSON.stringify(item.value),
          label: item.name,
          type: 'text',
        }),
      ]);
    }),
  ]);
  return res.status(200).send({ message: 'Success' });
};

const deleteDraft = async (req, res) => {
  const { id } = req.params;
  const draftRequest = await draftRequestRepository.find(id);
  if (!draftRequest) {
    return respond(res, httpStatus.NOT_FOUND, 'Cound not find the draft request');
  }
  await draftRequestService.destroy(draftRequest.id);
  return respond(res, httpStatus.OK, 'Draft deleted sucessfully');
};

module.exports = {
  store,
  getDraftById,
  allDrafts,
  getDraftByAuthIdAndKey,
  editDraft,
  deleteDraft,
};
