const app = require("./app");
const { sequelize } = require("./models");
const { createEmailWorker } = require("./workers/emailWorker");
const config = require("./config");
const logger = require("./utils/logger");

const PORT = config.PORT;

sequelize
  .authenticate()
  .then(() => {
    createEmailWorker();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
