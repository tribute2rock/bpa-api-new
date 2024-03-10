module.exports = (sequelize, type) => {
  return sequelize.define('sub_request_value', {
    id: {
      autoIncrement: true,
      type: type.INTEGER,
      primaryKey: true,
    },
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
    subRequestId: {
      type: type.INTEGER,
      allowNull: false,
      references: {
        model: 'sub_requests',
        key: 'id',
      },
    },
    name: {
      type: type.STRING,
      allowNull: false,
    },
    value: {
      type: type.TEXT,
    },
    type: {
      type: type.STRING,
      allowNull: false,
    },
    label: {
      type: type.STRING,
      allowNull: false,
    },
  });
};
