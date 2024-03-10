module.exports = (sequelize, type) => {
  return sequelize.define('open_workflow_master', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requestId: {
      type: type.INTEGER,
      references: {
        model: 'requests',
        key: 'id',
      },
      allowNull: false,
    },
    workflowId: {
      type: type.INTEGER,
      references: {
        model: 'workflows',
        key: 'id',
      },
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
    userId: {
      type: type.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: type.INTEGER,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id',
      },
    },
  });
};
