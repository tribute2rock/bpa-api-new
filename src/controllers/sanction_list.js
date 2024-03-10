const httpStatus = require('http-status');
const { respond } = require('../utils/response');
const { sanctionListRepository } = require('../repositories');

const validate = async (req, res) => {
  const { field, value } = req.query;
  const sanction = await sanctionListRepository.all();
  const isValidHsCode = await sanctionListRepository.checkHsCode(value);
  const result = sanction.map((a) => a.code);
  if (field && value) {
    switch (field) {
      case 'hs_code':
        if (!isValidHsCode) {
          return res.send({
            status: false,
            valid: false,
            message: 'Invalid parameters supplied. HS code does not exists.',
          });
        }
        if (isValidHsCode && result.includes(value)) {
          return res.send({
            status: true,
            valid: false,
            message: 'HS code is sanctioned',
          });
        }
        if (isValidHsCode && !result.includes(value)) {
          return res.send({
            status: true,
            valid: true,
            message: 'Success',
          });
        }
        break;
      default:
        return res.send({
          status: false,
          message: 'Invalid parameters supplied.',
        });
    }
  }
  return res.send({
    status: false,
    message: 'Invalid parameters supplied.',
  });
};

module.exports = {
  validate,
};
