module.exports = (sequelize, type) => {
  return sequelize.define('system_logs', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
    requestExecute: {
      type: type.INTEGER,
    },
    request: {
      type: type.ENUM({
        values: ['Customer', 'Bank', 'Internal'],
      }),
    },
    otpEmail: {
      type: type.INTEGER,
    },
    route_type: {
      type: type.ENUM({
        values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      }),
    },
    request_type: {
      type: type.ENUM({
        values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      }),
    },
    request_status: {
      type: type.ENUM({
        values: ['Success', 'Error', 'Crash'],
      }),
    },
    routes: {
      type: type.STRING,
    },
    ipAddress: {
      type: type.STRING,
    },
    statusMessage: {
      type: type.TEXT,
    },
    os_details: {
      type: type.TEXT,
    },
    location_details: {
      type: type.TEXT,
    },
    platForm_details: {
      type: type.TEXT,
    },
    model: {
      type: type.STRING,
    },
    body: {
      type: type.TEXT,
    },
    queryType: {
      type: type.STRING,
    },
    queryExecute: {
      type: type.TEXT,
    },
    previousValue: {
      type: type.TEXT,
    },
    diff: {
      type: type.TEXT,
    },
    actionBy: {
      type: type.TEXT,
    },
    requested_date_time: {
      type: type.STRING,
    },
  });
};
