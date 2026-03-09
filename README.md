# Patient Registration API — Node.js / Express

REST API for patient registration built with Express, Sequelize, PostgreSQL, Redis and Docker.

## Features

- Patient registration with name, email, phone and document photo
- Joi validation on all inputs
- File upload with type and size checks (JPEG, PNG, WebP, PDF — max 5 MB)
- Orphaned file cleanup on registration failure
- Async email confirmation via BullMQ queue (persisted in Redis, retried on failure)
- Extensible notification system — ready for SMS in a new channel class
- API key auth on read endpoints
- Rate limiting on registration (10 req / 15 min)
- PostgreSQL persistence with Sequelize ORM + migrations
- Health check endpoint with real DB connectivity check
- Dockerized environment (Postgres + Redis + API, migrations run on startup)
- Swagger docs at `/api-docs`

## Project structure

```
src/
├── app.js
├── server.js
├── config/
│   ├── index.js
│   └── swagger.js
├── database/
│   ├── sequelize-cli.js          # sequelize-cli config
│   └── migrations/
│       └── 20250210114532-create-patients.js
├── models/
│   ├── index.js
│   └── Patient.js
├── controllers/
│   └── patientController.js
├── routes/
│   ├── index.js
│   └── patients.js
├── services/
│   └── patientService.js
├── validations/
│   └── patientValidation.js
├── notifications/
│   ├── NotificationChannel.js    # Abstract channel interface
│   ├── EmailChannel.js
│   └── NotificationService.js
├── queues/
│   └── emailQueue.js             # BullMQ queue definition
├── workers/
│   └── emailWorker.js            # Processes notification jobs
├── middlewares/
│   ├── upload.js
│   ├── apiKeyAuth.js
│   ├── rateLimiter.js
│   └── errorHandler.js
└── utils/
    └── logger.js
```

## Quick start

Copy the env file and fill in your Mailtrap credentials:

```bash
cp .env.example .env
```

Then start everything with Docker:

```bash
docker compose up --build
```

Migrations run automatically on startup. The API is available at `http://localhost:3000`.

For local development without Docker:

```bash
npm install
npm run db:migrate
npm run dev
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `patient_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `SMTP_HOST` | `sandbox.smtp.mailtrap.io` | SMTP host |
| `SMTP_PORT` | `2525` | SMTP port |
| `SMTP_USER` | — | Mailtrap user |
| `SMTP_PASSWORD` | — | Mailtrap password |
| `MAIL_FROM` | `noreply@patientapp.com` | Sender address |
| `UPLOAD_DIR` | `uploads` | File upload directory |
| `API_KEY` | `demo-api-key` | Key for read endpoints |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | DB connectivity check |
| `POST` | `/api/v1/patients/` | — | Register patient |
| `GET` | `/api/v1/patients/` | `x-api-key` | List patients (paginated) |
| `GET` | `/api/v1/patients/:id` | `x-api-key` | Get patient by ID |

Interactive docs: `http://localhost:3000/api-docs`

### Register a patient

```bash
curl -X POST http://localhost:3000/api/v1/patients/ \
  -F "name=Jane Doe" \
  -F "email=jane@example.com" \
  -F "phone=+1234567890" \
  -F "document_photo=@/path/to/id.jpg"
```

### List patients

```bash
curl http://localhost:3000/api/v1/patients/ \
  -H "x-api-key: demo-api-key"
```

Response includes `patients`, `total`, `offset` and `limit`.

## Database migrations

```bash
npm run db:migrate        # apply pending migrations
npm run db:migrate:undo   # roll back last migration
```

Migration files are generated with:

```bash
npx sequelize-cli migration:generate --name <name>
```

The timestamp prefix is added automatically by the CLI based on the current date/time.

## Run tests

```bash
npm test
```

## Adding SMS notifications

1. Create `src/notifications/SmsChannel.js` extending `NotificationChannel`
2. Push an instance into `this.channels` in `NotificationService.js`

The `NotificationService` loops over all registered channels, so SMS will be sent alongside email automatically.
