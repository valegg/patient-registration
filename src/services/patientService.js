const Patient = require("../models/Patient");

async function createPatient({ name, email, phone, documentPhoto }) {
  const existing = await Patient.findOne({ where: { email } });
  if (existing) {
    const err = new Error("A patient with this email address is already registered");
    err.status = 409;
    throw err;
  }

  return Patient.create({ name, email, phone, documentPhoto });
}

async function getPatientById(id) {
  return Patient.findByPk(id);
}

async function listPatients({ offset = 0, limit = 20 } = {}) {
  const { rows: patients, count: total } = await Patient.findAndCountAll({
    offset,
    limit,
    order: [["createdAt", "DESC"]],
  });
  return { patients, total };
}

module.exports = { createPatient, getPatientById, listPatients };
