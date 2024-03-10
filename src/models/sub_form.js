module.exports = (sequelize, type) => {
  return sequelize.define('sub_form', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    isDeleted: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
    type: {
      type: type.ENUM({
        values: ['dynamic', 'html'],
      }),
      defaultValue: 'dynamic',
    },
    name: {
      type: type.STRING,
      allowNull: false,
    },
    description: {
      type: type.TEXT,
      allowNull: false,
    },
    formData: {
      type: type.TEXT,
      allowNull: false,
    },
    css: {
      type: type.TEXT,
    },
    javascript: {
      type: type.TEXT,
    },
  });
};
