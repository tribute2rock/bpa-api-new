/**
 * All the models for the application are registered and exported from here.
 *
 */

const Sequelize = require('sequelize');
const connection = require('../config/database');

const Permission = require('./permission')(connection, Sequelize);
const Role = require('./role')(connection, Sequelize);
const RolePermission = require('./role_permission')(connection, Sequelize);
const Branch = require('./branch')(connection, Sequelize);
const Department = require('./department')(connection, Sequelize);
const Province = require('./province')(connection, Sequelize);
const User = require('./user')(connection, Sequelize);
const RoleUser = require('./role_user')(connection, Sequelize);
const Customer = require('./customer')(connection, Sequelize);
const Group = require('./group')(connection, Sequelize);
const GroupUser = require('./group_user')(connection, Sequelize);
const Trigger = require('./trigger')(connection, Sequelize);
const Action = require('./action')(connection, Sequelize);
const Category = require('./category')(connection, Sequelize);
const WorkflowView = require('./workflow_view')(connection, Sequelize);
const Workflow = require('./workflow')(connection, Sequelize);
const WorkflowLevel = require('./workflow_level')(connection, Sequelize);
const WorkflowMaster = require('./workflow_master')(connection, Sequelize);
const WorkflowLog = require('./workflow_log')(connection, Sequelize);
const WorkflowFiles = require('./workflow_files')(connection, Sequelize);
const Status = require('./status')(connection, Sequelize);
const Form = require('./form')(connection, Sequelize);
const Request = require('./request')(connection, Sequelize);
const RequestValue = require('./request_value')(connection, Sequelize);
const SubForm = require('./sub_form')(connection, Sequelize);
const SubRequest = require('./sub_request')(connection, Sequelize);
const SubRequestValue = require('./sub_request_value')(connection, Sequelize);
const DraftRequest = require('./draft_request')(connection, Sequelize);
const DraftRequestValue = require('./draft_request_value')(connection, Sequelize);
const PrintTemplate = require('./print_temp')(connection, Sequelize);
const PrintTemplateForm = require('./print_temp_form')(connection, Sequelize);
const FormWorkflowChain = require('./form_workflow_chain')(connection, Sequelize);
const HsCode = require('./hs_code')(connection, Sequelize);
const SanctionList = require('./sanction_list')(connection, Sequelize);
const ReferenceNumber = require('./reference_no')(connection, Sequelize);
const SystemRequestLogs = require('./system_request_logs')(connection, Sequelize);
const OtpEmailLogs = require('./otp_email_logs')(connection, Sequelize);
const FormGroup =  require('./group_form')(connection, Sequelize);
const OpenWorkFlowMaster = require('./open_workflow_master')(connection,Sequelize);
const OpenWorkFlowLogs = require('./open_workflow_log')(connection, Sequelize);

/**
 * Relationships
 */
Role.belongsToMany(Permission, { through: RolePermission });
Permission.belongsToMany(Role, { through: RolePermission });


// UserGroup and Forms Permissions.



module.exports = {
  Branch,
  Province,
  Department,
  User,
  Group,
  GroupUser,
  Action,
  Permission,
  Role,
  RolePermission,
  RoleUser,
  WorkflowView,
  Workflow,
  WorkflowLevel,
  WorkflowLog,
  WorkflowFiles,
  WorkflowMaster,
  Trigger,
  Form,
  Customer,
  Category,
  Status,
  Request,
  RequestValue,
  SubForm,
  SubRequest,
  SubRequestValue,
  DraftRequest,
  DraftRequestValue,
  PrintTemplate,
  PrintTemplateForm,
  FormWorkflowChain,
  HsCode,
  SanctionList,
  ReferenceNumber,
  SystemRequestLogs,
  OtpEmailLogs,
  FormGroup,
  OpenWorkFlowMaster,
  OpenWorkFlowLogs
};
