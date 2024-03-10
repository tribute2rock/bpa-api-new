const {
  userAuthorizationEmailTemplate,
  sendEmailTemplates,
  customerPasswordResetEmailTemplate,
  sendActionTemplates,
  requestReturnEmailTemplate,
  requestApproveEmailTemplate,
  requestReturnEmailTemplateBranch,
  requestApproveEmailTemplateBranch,
} = require('./email_templates');
const { sendMessage, sendMessageToSwift } = require('./email');

module.exports.sendAuthorizationEmail = async (body) => {
  sendMessage(userAuthorizationEmailTemplate(body));
};

module.exports.sendMessageTemp = async (body, subject) => {
  sendMessageToSwift(sendEmailTemplates(body, subject));
};

module.exports.sendRestPasswordEmail = async (body) => {
  sendMessage(customerPasswordResetEmailTemplate(body));
};

module.exports.sendRequestActionMail = async (body) => {
  sendMessage(sendActionTemplates(body));
};

module.exports.sendRequestReturnEmail = async (body) => {
  sendMessage(requestReturnEmailTemplate(body));
};

module.exports.sendRequestApproveEmail = async (body) => {
  sendMessage(requestApproveEmailTemplate(body));
};

module.exports.sendRequestReturnEmailBranch = async (body) => {
  sendMessage(requestReturnEmailTemplateBranch(body));
};

module.exports.sendRequestApproveEmailBranch = async (body) => {
  sendMessage(requestApproveEmailTemplateBranch(body));
};
