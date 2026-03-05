const { DataTypes } = require("sequelize");
const { sequelize } = require("./index");

const Patient = sequelize.define(
  "Patient",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    documentPhoto: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "document_photo",
    },
  },
  {
    tableName: "patients",
    underscored: true,
  }
);

module.exports = Patient;
