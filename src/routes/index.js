const { Router } = require("express");
const patientRoutes = require("./patients");

const router = Router();

router.use("/patients", patientRoutes);

module.exports = router;
