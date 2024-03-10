const { SanctionList, HsCode } = require('../models');

const all = () => {
  return SanctionList.findAll({ where: { isDeleted: false } });
};

const single = async (id) => {
  return SanctionList.findOne({
    where: {
      id,
    },
  });
};

const checkHsCode = (value) => {
  return HsCode.findAll({ where: { isDeleted: false, code: value } });
};
module.exports = {
  all,
  single,
  checkHsCode,
};
