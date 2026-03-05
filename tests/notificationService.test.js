let mockSend;
let service;

beforeEach(() => {
  mockSend = jest.fn().mockResolvedValue(undefined);
  jest.resetModules();
  jest.mock("../src/notifications/EmailChannel", () =>
    jest.fn().mockImplementation(() => ({ send: mockSend }))
  );
  service = require("../src/notifications/NotificationService");
});

describe("notifyPatientRegistered", () => {
  const patient = { name: "Jane Doe", email: "jane@example.com" };

  test("calls send on the email channel with correct recipient and subject", async () => {
    await service.notifyPatientRegistered(patient);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const [recipient, subject] = mockSend.mock.calls[0];
    expect(recipient).toBe("jane@example.com");
    expect(subject).toBe("Registration Confirmed");
  });

  test("includes the patient name in the email content", async () => {
    await service.notifyPatientRegistered(patient);

    const [, , content] = mockSend.mock.calls[0];
    expect(content.html).toContain("Jane Doe");
    expect(content.text).toContain("Jane Doe");
  });

  test("does not throw if a channel fails", async () => {
    mockSend.mockRejectedValue(new Error("SMTP error"));

    await expect(service.notifyPatientRegistered(patient)).resolves.toBeUndefined();
  });

  test("continues to next channel if one fails", async () => {
    const secondMockSend = jest.fn().mockResolvedValue(undefined);
    service.channels = [
      { send: jest.fn().mockRejectedValue(new Error("first channel fails")) },
      { send: secondMockSend },
    ];

    await service.notifyPatientRegistered(patient);

    expect(secondMockSend).toHaveBeenCalledTimes(1);
  });
});
