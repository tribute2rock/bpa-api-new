const validator = require('../utils/validation');

/**
 * Validates a login request.
 * @param req
 * @param res
 * @param next
 */
const store = async (req, res, next) => {
  validator(req.body.form, {
    name: 'required',
    type: 'required',
    availableFor: 'required',
    categoryId: 'required',
    workflowId: 'required',
    description: 'required',
    formData: 'required',
  });
  next();
};

const update = async (req, res, next) => {
  validator(req.body.formData, {
    name: 'required|string|min:2|max:255',
    description: 'string|max:255',
  });
  next();
};

const destroy = async (req, res, next) => {
  validator(req.params, {
    id: 'required|numeric',
  });

  next();
};
module.exports = {
  store,
  update,
  destroy,
};
