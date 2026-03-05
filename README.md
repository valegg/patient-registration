# Patient Registration API — Node.js / Express

REST API for patient registration built with Express, Sequelize, PostgreSQL and Docker.

## Features

- Patient registration with name, email, phone and document photo
- Joi validation on all inputs
- File upload with type and size checks (JPEG, PNG, WebP, PDF — max 5 MB)
- Async email confirmation via fire-and-forget (Mailtrap for dev)
- Extensible notification system (ready for SMS integration)
- PostgreSQL persistence with Sequelize ORM
- Dockerized development environment

## Project structure

```
src/
├── app.js                          # Express app setup
├── server.js                       # Entry point (DB sync + listen)
├── config/
│   └── index.js                    # Config from environment variables
├── models/
│   ├── index.js                    # Sequelize instance
│   └── Patient.js                  # Patient model
├── controllers/
│   └── patientController.js        # Route handlers
├── routes/
│   ├── index.js                    # Root router
│   └── patients.js                 # Patient routes
├── services/
│   └── patientService.js           # Business logic
├── validations/
│   └── patientValidation.js        # Joi schemas
├── notifications/
│   ├── NotificationChannel.js      # Abstract channel interface
│   ├── EmailChannel.js             # Email channel (Nodemailer/Mailtrap)
│   └── NotificationService.js      # Orchestrates all channels
├── middlewares/
│   ├── upload.js                   # Multer config
│   └── errorHandler.js             # Global error handler
└── utils/
    └── logger.js                   # Winston logger
```

## Quick start

```bash
docker compose up --build

npm run dev
```

The API will be available at `http://localhost:3000`.

## Register a patient

```bash
curl -X POST http://localhost:3000/api/v1/patients/ \
  -F "name=Jane Doe" \
  -F "email=jane@example.com" \
  -F "phone=+1234567890" \
  -F "document_photo=@/path/to/id.jpg"
```

## Run tests

```bash
npm install
npm test
```

## Adding SMS notifications

1. Create `src/notifications/SmsChannel.js` extending `NotificationChannel`
2. Import and push an instance into `this.channels` in `NotificationService.js`

