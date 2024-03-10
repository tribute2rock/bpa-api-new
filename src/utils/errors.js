const httpStatus = require('http-status');
const { respond } = require('./response');
const logger = require('../config/logger');
const config = require('../config');

/**
 * Handles all application errors and send response to client
 */
const ErrorHandler = (err, req, res, next) => {
  
  const { name } = err;
  let message;
  if(name != 'User Not Authorized'){
    console.log(err);
    logger.error(err);
  }

  if (!config.env == 'development') message = err.message;
  else message = err.name;

  console.log('====================================');
  console.log(err.name);
  console.log('====================================');
  switch (name) {
    case 'Invalid Refresh Token':
      respond(res, httpStatus.FORBIDDEN, message);
      break;
    case 'User Not Authenticated':
      respond(res, httpStatus.UNAUTHORIZED, message);
      break;
    case 'User Not Authorized':
      respond(res, httpStatus.FORBIDDEN, message);
      break;
    case 'User Not Guest':
      respond(res, httpStatus.FORBIDDEN, message);
      break;
    case 'Validation Error':
      respond(res, httpStatus.PRECONDITION_FAILED, message);
      break;
    default:
      respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Oops! Something went wrong.');
  }
};

module.exports = ErrorHandler;
