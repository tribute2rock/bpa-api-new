module.exports = (sequelize, type) => {
  return sequelize.define('workflow_level', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    workflowId: {
      type: type.INTEGER,
      allowNull: false,
      references: {
        model: 'workflows',
        key: 'id',
      },
    },
    level: {
      type: type.INTEGER,
      allowNull: false,
    },
    groupId: {
      type: type.INTEGER,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
    },
    subformId: {
      type: type.INTEGER,
      references: {
        model: 'sub_forms',
        key: 'id',
      },
      allowNull: true,
    },
    trigger: {
      type: type.STRING,
    },
    isApprover: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
    multiplePicker: {
      type: type.INTEGER,
      allowNull: true,
    },
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
  });
};
