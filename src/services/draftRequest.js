const { draftRequestRepository } = require('../repositories');

const destroy = (id) => {
  return draftRequestRepository.destroy(id);
};

module.exports = {
  destroy,
};
