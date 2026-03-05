const patientService = require("../services/patientService");
const notificationService = require("../notifications/NotificationService");
const { validateRegisterPatient } = require("../validations/patientValidation");

async function registerPatient(req, res, next) {
  try {
    const { valid, errors, value } = validateRegisterPatient(req.body);
    if (!valid) {
      return res.status(422).json({ errors });
    }

    if (!req.file) {
      return res.status(422).json({ errors: ["Document photo is required"] });
    }

    const patient = await patientService.createPatient({
      name: value.name,
      email: value.email,
      phone: value.phone,
      documentPhoto: req.file.path,
    });

    // The email is send asynchronously and we don't want to block the response, so we catch any errors to prevent unhandled promise rejections
    notificationService.notifyPatientRegistered(patient).catch(() => {});

    return res.status(201).json(patient);
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ errors: [err.message] });
    }
    next(err);
  }
}

async function getPatient(req, res, next) {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ errors: ["Patient not found"] });
    }
    return res.json(patient);
  } catch (err) {
    next(err);
  }
}

async function listPatients(req, res, next) {
  try {
    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const patients = await patientService.listPatients({ offset, limit });
    return res.json(patients);
  } catch (err) {
    next(err);
  }
}

module.exports = { registerPatient, getPatient, listPatients };
