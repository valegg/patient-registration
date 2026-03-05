const { Router } = require("express");
const upload = require("../middlewares/upload");
const { registerPatient, getPatient, listPatients } = require("../controllers/patientController");

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Gestión de pacientes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Maria Pérez
 *         email:
 *           type: string
 *           example: maria@example.com
 *         phone:
 *           type: string
 *           example: "+59899123456"
 *         documentPhoto:
 *           type: string
 *           example: uploads/photo.jpg
 */

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Listar todos los pacientes
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 */
router.get("/", listPatients);

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Obtener un paciente por ID
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Datos del paciente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Paciente no encontrado
 */
router.get("/:id", getPatient);

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Registrar un nuevo paciente
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - document_photo
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maria Pérez
 *               email:
 *                 type: string
 *                 example: maria@example.com
 *               phone:
 *                 type: string
 *                 example: "+59899123456"
 *               document_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Paciente registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Datos inválidos
 */
router.post("/", upload.single("document_photo"), registerPatient);

module.exports = router;
