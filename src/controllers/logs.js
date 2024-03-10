const httpStatus = require('http-status');
const { getPagination } = require('../utils/pagination');
const { getPagingData } = require('../utils/pagination');
const { logsRepository } = require('../repositories');
// const { categoryService } = require('../services');
const { respond } = require('../utils/response');
const { SystemRequestLogs, OtpEmailLogs } = require('../models');

const allLogs = async (req, res) => {
  let systemLogs;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let system_logs;
    // for searching system_logs and paginating the search
    if (req.query?.search) {
      201;
      const search = req.query.search || 2;
      system_logs = await logsRepository.searchPaginate(limit, offset, search);
    } else {
      system_logs = await logsRepository.systemLogsPaginate(limit, offset);
    }
    systemLogs = getPagingData(system_logs, page, limit, offset);
  } else {
    // systemLogs = await logsRepository.all();
    systemLogs = await SystemRequestLogs.findAll({
      where: {
        isDeleted: false,
      },
    });
  }
  return respond(res, httpStatus.OK, null, systemLogs);
};

const OTPEmailLogs = async (req, res) => {
  let otpEmailLogs;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let otp_Email;
    // for searching otpEmail and paginating the search
    if (req.query?.search) {
      201;
      const search = req.query.search;
      otp_Email = await logsRepository.searchOTPEmailPaginate(limit, offset, search);
    } else {
      otp_Email = await logsRepository.OTPEmailPaginate(limit, offset);
    }
    otpEmailLogs = getPagingData(otpEmail, page, limit, offset);
  } else {
    // categoryList = await logsRepository.all();
    otpEmailLogs = await OtpEmailLogs.findAll({
      where: {
        isDeleted: false,
      },
    });
  }
  return respond(res, httpStatus.OK, null, otpEmailLogs);
};

module.exports = {
  allLogs,
  OTPEmailLogs,
};
