const { Queue } = require("bullmq");
const config = require("../config");

const emailQueue = new Queue("patient-notifications", {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

module.exports = emailQueue;
