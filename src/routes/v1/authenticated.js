const express = require('express');
const {
  formValidation,
  userValidation,
  departmentValidation,
  categoryValidation,
  requestValidation,
  // groupValidation,
} = require('../../validations');
const middlewares = require('../../middlewares');
const {
  rolesController,
  workflowController,
  usersController,
  permissionsController,
  formsController,
  subFormsController,
  utilsController,
  ldapController,
  departmentsController,
  categoriesController,
  requestsController,
  draftRequestController,
  groupController,
  printController,
  branchController,
  triggerController,
  seedController,
  customersController,
  reportController,
} = require('../../controllers');
const multer = require('../../config/multer');
const customerMulter = require('../../config/customerMulter');
const permissions = require('../../constants/permissions');

const router = express.Router();

router.get('/bpa-seed', seedController.handleSeed);

router.use(middlewares.isAuthenticated);

/**
 * Permission routes
 */
router.get('/permissions', middlewares.hasPermission(permissions.ViewPermissions), permissionsController.index);

/**
 * Role routes
 */
router.get('/roles', middlewares.hasPermission(permissions.ViewAllRoles), rolesController.all);
router.get('/paginate-roles', middlewares.hasPermission(permissions.ViewAllRoles), rolesController.allPaginate);
router.post('/roles', [middlewares.hasPermission(permissions.CreateRole), middlewares.systemLogs], rolesController.store);
router.get('/roles/:id', middlewares.hasPermission(permissions.ViewRole), rolesController.single);
router.put(
  '/roles/:id',
  [middlewares.hasPermission(permissions.UpdateRole), middlewares.systemLogs],
  rolesController.update
);
router.delete(
  '/roles/:id',
  [middlewares.hasPermission(permissions.DeleteRole), middlewares.systemLogs],
  rolesController.destroy
);
//
router.get('/getBgData', middlewares.hasPermission(permissions.ViewIssuranceRegister), requestsController.getBgData);

/**
 * User routes
 */
router.get('/all-users', middlewares.hasPermission(permissions.ViewAllUsers), usersController.allUsers);
router.get('/users', middlewares.hasPermission(permissions.ViewAllUsers), usersController.all);
router.post(
  '/users',
  [middlewares.hasPermission(permissions.CreateUser), userValidation.store, middlewares.systemLogs],
  usersController.store
);
router.get('/users/:id', middlewares.hasPermission(permissions.ViewUser), usersController.single);
router.put(
  '/users/:id',
  [middlewares.hasPermission(permissions.UpdateUser), userValidation.update, middlewares.systemLogs],
  usersController.update
);
router.put('/userss/:id', usersController.updateStatus);
router.delete(
  '/users/:id',
  [middlewares.hasPermission(permissions.DeleteUser), middlewares.systemLogs],
  usersController.destroy
);

/**
 * Customer routes
 */
// router.get('/all-users', middlewares.hasPermission(permissions.ViewAllUsers), usersController.allUsers);
router.get('/customers', middlewares.hasPermission(permissions.ViewAllUsers), customersController.all);
router.post(
  '/customers/resetPassword',
  middlewares.hasPermission(permissions.CreateUser),
  customersController.resetPassword
);
router.post('/customers', [middlewares.hasPermission(permissions.CreateUser), userValidation.store], usersController.store);
router.get('/customers/:id', middlewares.hasPermission(permissions.ViewUser), usersController.single);
router.put(
  '/customers/:id',
  [middlewares.hasPermission(permissions.UpdateUser), userValidation.update],
  usersController.update
);
router.put('/customerss/:id', usersController.updateStatus);
router.delete('/customers/:id', middlewares.hasPermission(permissions.DeleteUser), usersController.destroy);

/**
 * Customer registration on Request completion
 */
// router.post('/register-corporate-customer', triggerController.registerCorporate);

/**
 * Workflow routes
 */
router.get('/workflow', middlewares.hasPermission(permissions.ViewAllWorkflows), workflowController.all);
router.post('/workflow', middlewares.hasPermission(permissions.CreateWorkflow), workflowController.store);
router.get('/workflow/:id', middlewares.hasPermission(permissions.ViewWorkflow), workflowController.single);
router.put('/workflow', middlewares.hasPermission(permissions.UpdateWorkflow), workflowController.update);
router.delete('/workflow/:id', middlewares.hasPermission(permissions.DeleteWorkflow), workflowController.destroy);
router.get('/active-workflow/:id', middlewares.hasPermission(permissions.ViewAllWorkflows), workflowController.countActive);

/**
 * Form routes
 */
router.get('/forms', middlewares.hasPermission(permissions.ViewAllForms), formsController.all);
router.post('/forms', middlewares.hasPermission(permissions.CreateForm), formsController.store);
router.get('/forms/:id', formsController.single);
router.get('/canEdit/:id', formsController.canEdit);
router.put('/form/:id', [middlewares.hasPermission(permissions.UpdateForm), formValidation.update], formsController.update);
router.put('/forms/:id', formsController.updateStatus);
router.put('/forms-test/:id', formsController.updateTestEnabled);
router.delete('/form/:id', middlewares.hasPermission(permissions.DeleteForm), formsController.destroy);
router.get('/active-form/:id', middlewares.hasPermission(permissions.ViewAllForms), formsController.countActive);
// route for New Request
router.get('/formss/:catid/', formsController.getFormsByCatId);
// Route for form clone
router.post('/form-clone/:id', formsController.cloneForm);

/**
 * Routes for draft requests.
 */
router.post('/draft-request', multer, draftRequestController.store);
router.get('/draft-request', draftRequestController.allDrafts);
router.get('/draft-requestId', draftRequestController.getDraftById);
router.get('/draft-request/:id', draftRequestController.getDraftByAuthIdAndKey);
router.post('/draft-request/:id', draftRequestController.editDraft);
router.delete('/draft-request/:id', draftRequestController.deleteDraft);
router.delete('/forms/:id', middlewares.hasPermission(permissions.DeleteForm), formsController.destroy);

/**
 * Routes for Sub form
 */
router.get('/sub-forms', subFormsController.all);
router.post('/sub-forms', subFormsController.store);
router.get('/sub-forms/:id', subFormsController.single);
router.put('/sub-forms/:id', subFormsController.update);
router.delete('/sub-forms/:id', subFormsController.destroy);

/**
 * Utils route
 */
router.get('/triggers', middlewares.hasPermission(permissions.ViewTriggers), utilsController.getAllTriggers);
router.get('/return-users', middlewares.hasPermission(permissions.ViewReturnUsers), utilsController.getReturnUsers);
router.get('/workflow-users', workflowController.users);
/**
 * Ldap information routes
 */
router.get('/ldap-users', middlewares.hasPermission(permissions.ViewLdapUsers), ldapController.users);
// router.get('/ldap-branches', middlewares.hasPermission(permissions.ViewLdapBranches), ldapController.branches);
// router.get('/ldap-provinces', middlewares.hasPermission(permissions.ViewLdapProvinces), ldapController.provinces);
// router.get('/allLdapListCM', LDAPUtil.allLdapListCM);

/**
 * Department routes
 */
router.get('/departments', middlewares.hasPermission(permissions.ViewAllDepartments), departmentsController.all);
router.post(
  '/departments',
  [middlewares.hasPermission(permissions.CreateDepartment), departmentValidation.store],
  departmentsController.store
);
router.get('/departments/:id', middlewares.hasPermission(permissions.ViewDepartment), departmentsController.single);
router.put(
  '/departments/:id',
  [middlewares.hasPermission(permissions.UpdateDepartment), departmentValidation.update],
  departmentsController.update
);
router.delete('/departments/:id', middlewares.hasPermission(permissions.DeleteDepartment), departmentsController.destroy);

/**
 * Category routes
 */
router.get('/categories', middlewares.hasPermission(permissions.ViewAllCategories), categoriesController.all);
router.post(
  '/categories',
  [middlewares.hasPermission(permissions.CreateCategory), customerMulter.any('files')],
  categoriesController.store
);
router.get('/categories/:id', middlewares.hasPermission(permissions.ViewCategory), categoriesController.single);
router.put(
  '/categories/:id',
  [middlewares.hasPermission(permissions.UpdateCategory), customerMulter.any('files')],
  categoriesController.update
);
router.delete('/categories/:id', middlewares.hasPermission(permissions.DeleteCategory), categoriesController.destroy);
router.put(
  '/categories/:id/status',
  middlewares.hasPermission(permissions.UpdateCategory),
  categoriesController.toggleStatus
);
/** This route will return only the available categories */
router.get('/categoryForms', categoriesController.categoryForms);

/**
 * Request routes
 */
router.get('/requests', middlewares.hasPermission(permissions.ViewRequests), requestsController.all);
router.get('/requests/:id', middlewares.hasPermission(permissions.ViewRequest), requestsController.single);
router.get(
  '/requests/:id/available-actions',
  middlewares.hasPermission(permissions.ViewActions),
  requestsController.getAvailableActions
);
router.post(
  '/requests/:id/action',
  [middlewares.hasPermission(permissions.PerformRequestAction), multer, requestValidation.action],
  requestsController.action
);
router.put('/requests-verification', requestsController.VerifyRequestItems);

router.get('/getNotifications', requestsController.ViewNotifications);

// route to redirect user to internal request (customer portal)
router.get('/internal-requests', requestsController.internalRequest);
router.post('/internal-requests', multer, requestsController.store);
// available sub form for request
router.get('/requests/:id/subform', requestsController.getSubform);
// posting subrequest (incase of new user posting) OR updating the previous data
router.post('/subrequests', multer, requestsController.storeSub);
// available gropus to refer for a request
router.get('/refer-groups', requestsController.getReferGroups);
router.get('/return-groups', requestsController.getReturnGroups);
router.get('/requests-count', requestsController.getRequestsCount);
router.get('/internal-count', requestsController.getInternalCount);

// corporate internal request count
router.get('/corporate-internal-count', requestsController.getCorporateInternalCount);
router.get('/corporate-external-count', requestsController.getCorporateExternalCount);

router.get('/all-requests-count', requestsController.getAllRequestsCount);

// to retrieve print template details on request
router.get('/request/:id/getPrintTemplate', requestsController.getPrintRequest);

/**
 * Group routes
 */
router.get('/groups', middlewares.hasPermission(permissions.ViewAllGroups), groupController.all);
router.post('/groups', [middlewares.hasPermission(permissions.CreateGroup), middlewares.systemLogs], groupController.store);
router.get('/groups/:id', middlewares.hasPermission(permissions.ViewGroup), groupController.single);
router.put(
  '/groups/:id',
  [middlewares.hasPermission(permissions.UpdateGroup), middlewares.systemLogs],
  groupController.update
);
router.delete(
  '/groups/:id',
  [middlewares.hasPermission(permissions.DeleteGroup), middlewares.systemLogs],
  groupController.destroy
);

/**
 * branch routes
 */
router.get('/branch', branchController.all);
router.post('/branch', middlewares.hasPermission(permissions.CreateBranch), branchController.store);
router.get('/branch/:id', middlewares.hasPermission(permissions.ViewBranch), branchController.single);
router.put('/branch/:id', middlewares.hasPermission(permissions.UpdateBranch), branchController.update);
router.delete('/branch/:id', middlewares.hasPermission(permissions.DeleteBranch), branchController.destroy);

// Route for retrieving manual group
router.get('/manualGroups', middlewares.hasPermission(permissions.ViewAllGroups), groupController.allManual);

// Route for getting all forms for request export
router.get('/export-form', middlewares.hasPermission(permissions.ExportRequest), formsController.all);
/**
 * Route for print Template
 */
router.get('/printTemp', printController.all);
router.get('/printTemp/:id', printController.single);
router.post('/printTemp', printController.store);
router.put('/printTemp/:id', printController.update);
router.delete('/printTemp/:id', printController.destroy);

// Assign Form Routes
router.post('/assign-form', formsController.assignForms);

router.get('/assignedForms/:id', formsController.getAssignedFormUsers);

// Route for Reporting Api
// router.get('/reportingApi', reportController.getReport);
router.get('/LcReports', reportController.getReportLc);
router.get('/BgReports', reportController.getReportBg);
router.get('/sis-Reports', reportController.getReportSis);

//Fetching Bibini Requests
router.get('/bibini', requestsController.getBiBiniList);

module.exports = router;
