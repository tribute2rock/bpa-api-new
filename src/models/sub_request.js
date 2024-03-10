module.exports = (sequelize, type) => {
  return sequelize.define('sub_request', {
    id: {
      autoIncrement: true,
      type: type.INTEGER,
      primaryKey: true,
    },
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
    requestId: {
      type: type.INTEGER,
      allowNull: false,
      references: {
        model: 'requests',
        key: 'id',
      },
    },
    senderId: {
      type: type.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subFormId: {
      type: type.INTEGER,
      allowNull: false,
      references: {
        model: 'sub_forms',
        key: 'id',
      },
    },
  });
};
