module.exports = (sequelize, type) => {
  return sequelize.define('group_user', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    groupId: {
      type: type.INTEGER,
      allowNull: true,
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
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
  });
};
