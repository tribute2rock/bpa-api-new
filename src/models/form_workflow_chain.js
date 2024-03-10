module.exports = (sequelize, type) => {
  return sequelize.define('form_workflow_chain', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
    formId: {
      type: type.INTEGER,
      references: {
        model: 'forms',
        key: 'id',
      },
    },
    workflowId: {
      type: type.INTEGER,
      references: {
        model: 'workflows',
        key: 'id',
      },
    },
  });
};
