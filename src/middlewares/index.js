const UserNotAuthenticated = require('../errors/auth');
const UserNotAuthorized = require('../errors/authorization');
const UserNotGuest = require('../errors/guest');
const { User } = require('../models');
const user = require('../models/user');
const jwt = require('../utils/jwt');
const geoip = require('geoip-lite');
const DeviceDetector = require('node-device-detector');
const BasicAuthUser = process.env.AUTH_USER_EXTERNAL;
const BasicAuthPass = process.env.AUTH_PASS_EXTERNAL;
const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});
const { systemLogsQurey, difference } = require('../config/logs');

/**
 * Checks if the jwt token is valid and injects the user
 * data into the request object.
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const isAuthenticated = async (req, res, next) => {
  if (!req.headers.authorization) {
    throw new UserNotAuthenticated();
  }
  const token = req.headers.authorization.split(' ')[1];
  const { status: valid, data } = jwt.isValidToken(token);

  if (!valid) {
    throw new UserNotAuthenticated();
  }

  if (data?.id) {
    const isUserDeleted = await User.findOne({
      where: {
        id: data?.id,
        isDeleted: false,
      },
      raw: true,
    });

    if (!isUserDeleted) throw new UserNotAuthorized();
  }

  req.user = data;
  next();
};

/**
 * Checks if the jwt token is present in the header. If token is
 * present the request is not from a guest.
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const isGuest = async (req, res, next) => {
  if (req.headers.authorization) {
    throw new UserNotGuest();
  }
  next();
};

/**
 * Checks if a user has specific permission.
 *
 * @param permission
 * @returns {function(*, *, *): void}
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    const { permissions } = req.user;
    if (!permissions) {
      throw new UserNotAuthorized();
    }
    if (!permissions.includes(permission)) {
      throw new UserNotAuthorized();
    }
    next();
  };
};

const externalAuth = async (req, res, next) => {
  if (!req.headers.authorization) {
    throw new UserNotAuthenticated();
  }

  const base64Credentials = req.headers.authorization.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  if (username !== BasicAuthUser || password !== BasicAuthPass) {
    throw new UserNotAuthenticated();
  }
  next();
};

const systemLogs = async (req, res, next) => {
  try {
    const userAgent = req?.headers?.['User-Agent'] || req?.headers?.['user-agent'];
    const geoLocation = geoip.lookup('27.34.68.129');
    const deviceDetails = detector.detect(userAgent);
    const request = 'Bank';
    const filter = '';
    const route_type = req?.method;
    const request_type = req?.method;
    const request_status = 'Success';
    const routes = req?.url;
    const ipAddress = req?._remoteAddress;
    const statusMessage = '';
    const os_details = JSON.stringify(deviceDetails?.os) || '';
    const platForm_details = JSON.stringify(deviceDetails?.client);
    const location_details = JSON.stringify(geoLocation);
    const body = JSON.stringify(req?.body);
    const queryType = '';
    const queryExecute = '';
    const previousValue = '';
    const diff = '';
    const actionBy = req?.user ? req?.user.employeeCD + ' : ' + req?.user.email : '';
    const requested_date_time = '' || JSON.stringify(req?._startTime);

    logFinalObj = {
      request: request,
      filter: filter,
      route_type: route_type,
      request_type: request_type,
      request_status: request_status,
      routes: routes,
      ipAddress: ipAddress,
      statusMessage: statusMessage,
      os_details: os_details,
      platForm_details: platForm_details,
      location_details: location_details,
      body: body,
      queryType: queryType,
      queryExecute: queryExecute,
      previousValue: previousValue,
      diff: diff,
      actionBy: actionBy,
      requested_date_time: requested_date_time,
    };

    if (logFinalObj) {
      logoutput = await systemLogsQurey(logFinalObj);
      req.log = logFinalObj;
    } else {
      // throw new UserNotAuthenticated();
      return respond(res, HTTP.StatusUnauthorized, 'unable to create System log');
    }
  } catch (error) {
    console.log(error, 'here');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isGuest,
  hasPermission,
  externalAuth,
  systemLogs,
};
