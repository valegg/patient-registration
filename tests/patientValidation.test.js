const { validateRegisterPatient } = require("../src/validations/patientValidation");

const valid = { name: "Jane Doe", email: "jane@example.com", phone: "+1234567890" };

describe("validateRegisterPatient", () => {
  test("returns valid for correct data", () => {
    const result = validateRegisterPatient(valid);
    expect(result.valid).toBe(true);
    expect(result.value).toMatchObject(valid);
  });

  test("trims name whitespace", () => {
    const result = validateRegisterPatient({ ...valid, name: "  Jane  " });
    expect(result.valid).toBe(true);
    expect(result.value.name).toBe("Jane");
  });

  test("returns all errors at once when multiple fields are invalid", () => {
    const result = validateRegisterPatient({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  describe("name", () => {
    test("returns error when missing", () => {
      const { name, ...data } = valid;
      const result = validateRegisterPatient(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name is required");
    });

    test("returns error when too short", () => {
      const result = validateRegisterPatient({ ...valid, name: "A" });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/at least 2 characters/);
    });

    test("returns error when too long", () => {
      const result = validateRegisterPatient({ ...valid, name: "A".repeat(201) });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/exceed 200/);
    });
  });

  describe("email", () => {
    test("returns error when missing", () => {
      const { email, ...data } = valid;
      const result = validateRegisterPatient(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Email is required");
    });

    test("returns error when invalid format", () => {
      const result = validateRegisterPatient({ ...valid, email: "not-an-email" });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/valid email/);
    });
  });

  describe("phone", () => {
    test("returns error when missing", () => {
      const { phone, ...data } = valid;
      const result = validateRegisterPatient(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Phone number is required");
    });

    test("returns error when invalid format", () => {
      const result = validateRegisterPatient({ ...valid, phone: "abc" });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Phone number/);
    });

    test("accepts phone with spaces, dashes and parentheses", () => {
      const result = validateRegisterPatient({ ...valid, phone: "(123) 456-7890" });
      expect(result.valid).toBe(true);
    });
  });
});
