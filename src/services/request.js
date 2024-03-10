const { requestRepository } = require('../repositories');

const action = (id, data, uBranch, singleBranch, reqData) => {
  return requestRepository.action(id, data, uBranch, singleBranch, reqData);
};

module.exports = {
  action,
};
