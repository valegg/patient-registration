jest.mock("bullmq");
jest.mock("../src/notifications/NotificationService", () => ({
  notifyPatientRegistered: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const { Worker } = require("bullmq");
const notificationService = require("../src/notifications/NotificationService");
const logger = require("../src/utils/logger");

describe("createEmailWorker", () => {
  let workerInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    Worker.mockImplementation((name, processor, options) => {
      workerInstance = { on: jest.fn(), _name: name, _processor: processor, _options: options };
      return workerInstance;
    });
  });

  function getWorker() {
    // Re-require to get a fresh call with the mocked Worker
    jest.resetModules();
    jest.mock("bullmq");
    jest.mock("../src/notifications/NotificationService", () => ({
      notifyPatientRegistered: jest.fn().mockResolvedValue(undefined),
    }));
    jest.mock("../src/utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));
    const { Worker: W } = require("bullmq");
    W.mockImplementation((name, processor, options) => {
      workerInstance = { on: jest.fn(), _processor: processor };
      return workerInstance;
    });
    const { createEmailWorker } = require("../src/workers/emailWorker");
    createEmailWorker();
    return workerInstance;
  }

  test("creates worker targeting the patient-notifications queue", () => {
    const { createEmailWorker } = require("../src/workers/emailWorker");
    createEmailWorker();
    expect(Worker).toHaveBeenCalledWith(
      "patient-notifications",
      expect.any(Function),
      expect.objectContaining({ connection: expect.objectContaining({ host: expect.any(String) }) })
    );
  });

  test("processor calls notificationService with patient data", async () => {
    const { createEmailWorker } = require("../src/workers/emailWorker");
    createEmailWorker();
    const processor = Worker.mock.calls[0][1];

    const job = { id: "job-1", data: { patient: { name: "Jane", email: "jane@example.com" } } };
    await processor(job);

    expect(notificationService.notifyPatientRegistered).toHaveBeenCalledWith(job.data.patient);
  });

  test("logs info when job completes", () => {
    const { createEmailWorker } = require("../src/workers/emailWorker");
    createEmailWorker();
    const [, completedHandler] = workerInstance.on.mock.calls.find(([e]) => e === "completed");

    completedHandler({ id: "job-42" });

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("job-42"));
  });

  test("logs error when job fails", () => {
    const { createEmailWorker } = require("../src/workers/emailWorker");
    createEmailWorker();
    const [, failedHandler] = workerInstance.on.mock.calls.find(([e]) => e === "failed");

    failedHandler({ id: "job-42" }, new Error("SMTP timeout"));

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("job-42"));
  });
});
