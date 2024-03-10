const { Op } = require('sequelize');
const { DraftRequest, DraftRequestValue, Form } = require('../models');
const db = require('../config/database');

const find = async (needle, column = 'id') => {
  DraftRequest.hasOne(Form);

  const draftRequest = await DraftRequest.findOne({
    where: { id: needle, isDeleted: false },
    // include: [
    //   {
    //     model: Form,
    //     required: true,
    //   },
    // ],
  });

  return draftRequest;
};
const destroy = (id) => {
  return DraftRequest.update({ isDeleted: true }, { where: { id } });
};
module.exports = {
  find,
  destroy,
};
