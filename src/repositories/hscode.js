const { HsCode } = require('../models');

const all = () => {
  return HsCode.findAll({ where: { isDeleted: false } });
};

const single = async (id) => {
  return HsCode.findOne({
    where: {
      id,
    },
  });
};

module.exports = {
  all,
  single,
};
