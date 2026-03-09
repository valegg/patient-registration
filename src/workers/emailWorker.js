const { Worker } = require("bullmq");
const config = require("../config");
const notificationService = require("../notifications/NotificationService");
const logger = require("../utils/logger");

function createEmailWorker() {
  const worker = new Worker(
    "patient-notifications",
    async (job) => {
      await notificationService.notifyPatientRegistered(job.data.patient);
    },
    {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
      },
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Notification job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Notification job ${job.id} failed: ${err.message}`);
  });

  return worker;
}

module.exports = { createEmailWorker };
