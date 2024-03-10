const httpStatus = require('http-status');
var jwt = require('jsonwebtoken');
const { respond } = require('../utils/response');
var METABASE_SITE_URL = 'http://localhost:3000';
var METABASE_SECRET_KEY = '271c34e564297da1e457f84b2b96f5516167f54b9b7f37e26924b5f113f12d26';
/**
 * Returns iframe url
 * @param {*} idArr
 * @returns arr
 */
function getIframeUrl(idArr) {
  let urlArr = [];
  for (let i = 0; i < idArr.length; i++) {
    var payload = {
      resource: { dashboard: idArr[i] },
      params: {},
    };
    var token = jwt.sign(payload, METABASE_SECRET_KEY);

    var iframeUrl = METABASE_SITE_URL + '/embed/dashboard/' + token + '#bordered=true&titled=true';
    urlArr.push(iframeUrl);
  }
  return urlArr;
}
/**
 * Send Dashboard Count in Array ; See Dashboard Embedding Section in Metabase
 * @param {*} req
 * @param {*} res
 */
const getReport = (req, res) => {
  try {
    respond(res, httpStatus.OK, 'REPORTING URL', getIframeUrl([1, 34, 35, 33]));
  } catch (error) {
    console.log('ERROR IN REPORTING : METABASE', error);
  }
};

const getReportLc = (req, res) => {
  try {
    respond(res, httpStatus.OK, 'REPORTING URL', getIframeUrl([1, 34]));
  } catch (error) {
    console.log('ERROR IN REPORTING : METABASE', error);
  }
};
const getReportBg = (req, res) => {
  try {
    respond(res, httpStatus.OK, 'REPORTING URL', getIframeUrl([35, 33]));
  } catch (error) {
    console.log('ERROR IN REPORTING : METABASE', error);
  }
};
const getReportSis = (req, res) => {
  try {
    respond(res, httpStatus.OK, 'REPORTING URL', getIframeUrl([34]));
  } catch (error) {
    console.log('ERROR IN REPORTING : METABASE', error);
  }
};
module.exports = {
  getReport,
  getReportLc,
  getReportBg,
  getReportSis,
};
