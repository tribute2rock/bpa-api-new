module.exports = (sequelize, type) => {
  return sequelize.define('group', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: type.STRING,
      allowNull: false,
    },
    description: {
      type: type.TEXT,
      allowNull: false,
    },
    groupType: {
      type: type.ENUM({
        values: ['automatic', 'manual'],
      }),
      defaultValue: 'manual',
    },
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
  });
};
