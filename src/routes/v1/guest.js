const express = require('express');
const redis = require('../../config/redis');
const { authValidation, exportValidation } = require('../../validations');
const middlewares = require('../../middlewares');
const {
  loginController,
  requestsController,
  fieldValidationsController,
  ldapController,
  hsCodeController,
  sanctionListController,
  lcController,
  workflowViewController,
  logsController,
  ReferenceNumberController,
} = require('../../controllers');
const { adUsers } = require('../../mocks');
const LDAPUtil = require('../../utils/ldap')
const router = express.Router();

/**
 * Workflow View Form routes
 */
router.get('/workflowView', workflowViewController.getAll);

/**
 * all logs
 */
router.get('/systemLogs', logsController.allLogs);

/**
 * all logs
 */
router.get('/emailOtpLogs', logsController.OTPEmailLogs);
/**
 * Login routes
 */
router.get('/customer-uploads/:id/:type/:filename', requestsController.viewCustomerFile);
// generate PDF for request
router.get('/preview-request/:requestId/:templateId', requestsController.generateRequestDocument);
router.get('/download-request/:requestId/:templateId', requestsController.generateRequestDocument);
router.post('/download-request-edited', requestsController.generateRequestDocumentEdited);
router.get('/download-request-edited/:file', requestsController.downloadTemplateFile);
router.post('/send-mail-temp/:requestId', requestsController.handleSendMail);
router.get('/download-request/excel', exportValidation.requestExport, requestsController.exportExcel);
router.get('/handle-access-token', requestsController.handleToken);
router.get('/hs-code', hsCodeController.all);
router.get('/hs-code/:id', hsCodeController.single);
router.get('/sanction-list', sanctionListController.validate);

router.post('/bg/reference-number', ReferenceNumberController.generateRefNumber);
// router.put('/bg/reference-number', ReferenceNumberController.registerRefNumber);

router.post('/login', [middlewares.isGuest, authValidation.login], loginController.login);
router.post('/refresh-token', [middlewares.isGuest, authValidation.refresh], loginController.refresh);
router.get('/resign-users', ldapController.resUsers);
router.get('/populate/:id', requestsController.populate);
/**
 * Integration routes.
 */

// AD_AUTHENTICATION = "https://10.10.4.21/Sunwebserv/api/AdLogin"
router.route('/global-login').post((req, res) => {
  const user = adUsers.find((adUser) => adUser.USER_ID === req.body.UserName);
  if (user) {
    res.status(200).json({
      Message: 'Fetched Request Successful.',
      Status: 'success',
      Model: user,
    });
  } else {
    res.status(402).json({
      Message: 'Invalid credentials. Unable to Login.',
      Status: 'error',
    });
  }
});

// STAFF_LIST = "https://10.10.4.21/SunwebServ/api/UserList/GetAllUsers"
router.route('/global-staff').get((req, res) => {
  return res.json({ data: adUsers });
});

/**
 * Ldap routes.
 */

router.get('/GetAllUsers', ldapController.getAllUsers);
router.post('/AdLogin', ldapController.adLogin);
router.get('/ldap-users-CM', LDAPUtil.allLdapListCM);

module.exports = router;
