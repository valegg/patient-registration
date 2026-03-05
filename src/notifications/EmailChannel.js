const nodemailer = require("nodemailer");
const config = require("../config");
const logger = require("../utils/logger");
const NotificationChannel = require("./NotificationChannel");

class EmailChannel extends NotificationChannel {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }

  async send(recipient, subject, content) {
    await this.transporter.sendMail({
      from: config.smtp.from,
      to: recipient,
      subject,
      html: content.html,
      text: content.text,
    });

    logger.info(`Email sent to ${recipient}`);
  }
}

module.exports = EmailChannel;
