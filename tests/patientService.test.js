jest.mock("../src/models/Patient");

const Patient = require("../src/models/Patient");
const { createPatient, getPatientById, listPatients } = require("../src/services/patientService");

beforeEach(() => jest.clearAllMocks());

describe("createPatient", () => {
  const data = { name: "Jane", email: "jane@example.com", phone: "+1234567890", documentPhoto: "photo.jpg" };

  test("creates and returns patient when email is not taken", async () => {
    Patient.findOne.mockResolvedValue(null);
    Patient.create.mockResolvedValue({ id: 1, ...data });

    const result = await createPatient(data);

    expect(Patient.findOne).toHaveBeenCalledWith({ where: { email: "jane@example.com" } });
    expect(Patient.create).toHaveBeenCalledWith(data);
    expect(result.id).toBe(1);
  });

  test("throws 409 when email is already registered", async () => {
    Patient.findOne.mockResolvedValue({ id: 1, email: "jane@example.com" });

    const err = await createPatient(data).catch((e) => e);

    expect(err.status).toBe(409);
    expect(err.message).toMatch(/already registered/);
    expect(Patient.create).not.toHaveBeenCalled();
  });
});

describe("getPatientById", () => {
  test("returns patient when found", async () => {
    Patient.findByPk.mockResolvedValue({ id: 5, name: "Jane" });

    const result = await getPatientById(5);

    expect(Patient.findByPk).toHaveBeenCalledWith(5);
    expect(result.id).toBe(5);
  });

  test("returns null when not found", async () => {
    Patient.findByPk.mockResolvedValue(null);

    const result = await getPatientById(9999);

    expect(result).toBeNull();
  });
});

describe("listPatients", () => {
  test("calls findAll with default offset and limit", async () => {
    Patient.findAll.mockResolvedValue([]);

    await listPatients();

    expect(Patient.findAll).toHaveBeenCalledWith({
      offset: 0,
      limit: 20,
      order: [["createdAt", "DESC"]],
    });
  });

  test("calls findAll with provided offset and limit", async () => {
    Patient.findAll.mockResolvedValue([]);

    await listPatients({ offset: 10, limit: 5 });

    expect(Patient.findAll).toHaveBeenCalledWith({
      offset: 10,
      limit: 5,
      order: [["createdAt", "DESC"]],
    });
  });

  test("returns the list from the model", async () => {
    const patients = [{ id: 1 }, { id: 2 }];
    Patient.findAll.mockResolvedValue(patients);

    const result = await listPatients();

    expect(result).toEqual(patients);
  });
});
