const request = require("supertest");
const path = require("path");
const fs = require("fs");
const os = require("os");

const tmpUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "patient-test-"));
process.env.UPLOAD_DIR = tmpUploadDir;
process.env.DB_HOST = "localhost";

const app = require("../src/app");

// --- Mocks ---
jest.mock("../src/models/Patient", () => {
  const patients = [];
  let idCounter = 1;

  return {
    findOne: jest.fn(({ where }) =>
      Promise.resolve(patients.find((p) => p.email === where.email) || null)
    ),
    create: jest.fn((data) => {
      const patient = { id: idCounter++, ...data, createdAt: new Date(), updatedAt: new Date() };
      patients.push(patient);
      return Promise.resolve(patient);
    }),
    findByPk: jest.fn((id) =>
      Promise.resolve(patients.find((p) => p.id === parseInt(id)) || null)
    ),
    findAll: jest.fn(() => Promise.resolve([...patients])),
    _reset: () => {
      patients.length = 0;
      idCounter = 1;
    },
  };
});

jest.mock("../src/notifications/NotificationService", () => ({
  notifyPatientRegistered: jest.fn().mockResolvedValue(undefined),
}));

const Patient = require("../src/models/Patient");
const notificationService = require("../src/notifications/NotificationService");

beforeEach(() => {
  Patient._reset();
  jest.clearAllMocks();
});

afterAll(() => {
  fs.rmSync(tmpUploadDir, { recursive: true, force: true });
});

// --- Helper ---
function attachFile(req, filename = "doc.jpg", mimeType = "image/jpeg") {
  const buffer = Buffer.from("fake-document-content");
  return req.attach("document_photo", buffer, { filename, contentType: mimeType });
}

describe("POST /api/v1/patients/", () => {
  test("registers a patient successfully", async () => {
    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
        .field("phone", "+1234567890")
    );

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Jane Doe");
    expect(res.body.email).toBe("jane@example.com");
    expect(res.body).toHaveProperty("id");
  });

  test("returns 409 when email is already registered", async () => {
    Patient.findOne.mockResolvedValueOnce({ id: 1, email: "jane@example.com" });

    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
        .field("phone", "+1234567890")
    );

    expect(res.status).toBe(409);
  });

  test("returns 422 when name is missing", async () => {
    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("email", "jane@example.com")
        .field("phone", "+1234567890")
    );
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("errors");
  });

  test("returns 422 when email is invalid", async () => {
    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "not-an-email")
        .field("phone", "+1234567890")
    );
    expect(res.status).toBe(422);
  });

  test("returns 422 when phone is invalid", async () => {
    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
        .field("phone", "abc")
    );
    expect(res.status).toBe(422);
  });

  test("returns 422 when document_photo is missing", async () => {
    const res = await request(app)
      .post("/api/v1/patients/")
      .field("name", "Jane Doe")
      .field("email", "jane@example.com")
      .field("phone", "+1234567890");

    expect(res.status).toBe(422);
  });

  test("returns 422 when file type is not allowed", async () => {
    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
        .field("phone", "+1234567890"),
      "doc.txt",
      "text/plain"
    );
    expect(res.status).toBe(422);
  });

  test("returns 422 when email is missing", async () => {
    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("phone", "+1234567890")
    );
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("errors");
  });

  test("returns 201 even when notification fails", async () => {
    notificationService.notifyPatientRegistered.mockRejectedValueOnce(new Error("SMTP error"));

    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
        .field("phone", "+1234567890")
    );

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  test("returns 422 when phone is missing", async () => {
    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
    );
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("errors");
  });
});

describe("GET /api/v1/patients/:id", () => {
  test("returns patient when found", async () => {
    Patient.findByPk.mockResolvedValueOnce({
      id: 1,
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+1234567890",
    });

    const res = await request(app).get("/api/v1/patients/1");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("jane@example.com");
  });

  test("returns 404 when patient not found", async () => {
    Patient.findByPk.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/v1/patients/9999");
    expect(res.status).toBe(404);
  });

  test("returns 404 when id is not a valid number", async () => {
    Patient.findByPk.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/v1/patients/abc");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/patients/", () => {
  test("returns list of patients", async () => {
    Patient.findAll.mockResolvedValueOnce([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]);

    const res = await request(app).get("/api/v1/patients/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe("GET /health", () => {
  test("returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
