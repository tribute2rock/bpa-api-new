module.exports = (sequelize, type) => {
  return sequelize.define('sanction_list', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: type.STRING,
      allowNull: false,
    },
    description: {
      type: type.TEXT,
      allowNull: false,
    },
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
  });
};
