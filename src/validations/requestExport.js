const validator = require('../utils/validation');

/**
 * Request Export on excel
 */
const requestExport = async (req, res, next) => {
  validator(req.query, {
    startDate: 'required',
    endDate: 'required',
    formId: 'required',
  });
  next();
};

module.exports = {
  requestExport,
};
