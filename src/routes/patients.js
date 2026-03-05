const { Router } = require("express");
const upload = require("../middlewares/upload");
const apiKeyAuth = require("../middlewares/apiKeyAuth");
const { registrationLimiter } = require("../middlewares/rateLimiter");
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
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 *       description: "Development key: demo-api-key"
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
 *     PaginatedPatients:
 *       type: object
 *       properties:
 *         patients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Patient'
 *         total:
 *           type: integer
 *           example: 42
 *         offset:
 *           type: integer
 *           example: 0
 *         limit:
 *           type: integer
 *           example: 20
 */

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Listar todos los pacientes
 *     tags: [Patients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista paginada de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPatients'
 *       401:
 *         description: API key inválida o ausente
 */
router.get("/", apiKeyAuth, listPatients);

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Obtener un paciente por ID
 *     tags: [Patients]
 *     security:
 *       - ApiKeyAuth: []
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
 *       401:
 *         description: API key inválida o ausente
 *       404:
 *         description: Paciente no encontrado
 */
router.get("/:id", apiKeyAuth, getPatient);

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
 *       409:
 *         description: Email ya registrado
 *       422:
 *         description: Datos inválidos
 *       429:
 *         description: Demasiados intentos de registro
 */
router.post("/", registrationLimiter, upload.single("document_photo"), registerPatient);

module.exports = router;
