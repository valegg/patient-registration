const request = require("supertest");
const path = require("path");
const fs = require("fs");
const os = require("os");

const tmpUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "patient-test-"));
process.env.UPLOAD_DIR = tmpUploadDir;
process.env.DB_HOST = "localhost";

const app = require("../src/app");

// --- Mocks ---
jest.mock("../src/models", () => ({
  sequelize: { authenticate: jest.fn().mockResolvedValue(undefined) },
}));

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
    findAndCountAll: jest.fn(() => Promise.resolve({ rows: [...patients], count: patients.length })),
    _reset: () => {
      patients.length = 0;
      idCounter = 1;
    },
  };
});

jest.mock("../src/queues/emailQueue", () => ({
  add: jest.fn().mockResolvedValue({ id: "job-1" }),
}));

const Patient = require("../src/models/Patient");
const emailQueue = require("../src/queues/emailQueue");

const API_KEY = "demo-api-key";

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

  test("enqueues a notification after successful registration", async () => {
    await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
        .field("phone", "+1234567890")
    );

    expect(emailQueue.add).toHaveBeenCalledWith(
      "notify-patient-registered",
      expect.objectContaining({ patient: expect.objectContaining({ email: "jane@example.com" }) })
    );
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

  test("returns 201 even when queue enqueue fails", async () => {
    emailQueue.add.mockRejectedValueOnce(new Error("Redis error"));

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

  test("deletes uploaded file when DB creation fails", async () => {
    const unlinkSpy = jest.spyOn(fs, "unlink").mockImplementation((filePath, cb) => cb && cb(null));
    Patient.create.mockRejectedValueOnce(new Error("DB error"));

    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
        .field("phone", "+1234567890")
    );

    expect(res.status).toBe(500);
    expect(unlinkSpy).toHaveBeenCalled();
    unlinkSpy.mockRestore();
  });

  test("deletes uploaded file on duplicate email (409)", async () => {
    const unlinkSpy = jest.spyOn(fs, "unlink").mockImplementation((filePath, cb) => cb && cb(null));
    Patient.findOne.mockResolvedValueOnce({ id: 1, email: "jane@example.com" });

    const res = await attachFile(
      request(app)
        .post("/api/v1/patients/")
        .field("name", "Jane Doe")
        .field("email", "jane@example.com")
        .field("phone", "+1234567890")
    );

    expect(res.status).toBe(409);
    expect(unlinkSpy).toHaveBeenCalled();
    unlinkSpy.mockRestore();
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

    const res = await request(app)
      .get("/api/v1/patients/1")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("jane@example.com");
  });

  test("returns 401 when API key is missing", async () => {
    const res = await request(app).get("/api/v1/patients/1");
    expect(res.status).toBe(401);
  });

  test("returns 401 when API key is wrong", async () => {
    const res = await request(app)
      .get("/api/v1/patients/1")
      .set("x-api-key", "wrong-key");
    expect(res.status).toBe(401);
  });

  test("returns 404 when patient not found", async () => {
    Patient.findByPk.mockResolvedValueOnce(null);
    const res = await request(app)
      .get("/api/v1/patients/9999")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(404);
  });

  test("returns 404 when id is not a valid number", async () => {
    Patient.findByPk.mockResolvedValueOnce(null);
    const res = await request(app)
      .get("/api/v1/patients/abc")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/patients/", () => {
  test("returns paginated list of patients", async () => {
    Patient.findAndCountAll.mockResolvedValueOnce({
      rows: [{ id: 1, name: "A" }, { id: 2, name: "B" }],
      count: 2,
    });

    const res = await request(app)
      .get("/api/v1/patients/")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(res.body.patients).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body).toHaveProperty("offset");
    expect(res.body).toHaveProperty("limit");
  });

  test("returns 401 when API key is missing", async () => {
    const res = await request(app).get("/api/v1/patients/");
    expect(res.status).toBe(401);
  });
});

describe("GET /health", () => {
  test("returns ok when db is connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("connected");
  });

  test("returns 503 when db is unreachable", async () => {
    const { sequelize } = require("../src/models");
    sequelize.authenticate.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
  });
});
