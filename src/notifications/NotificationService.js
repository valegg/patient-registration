const EmailChannel = require("./EmailChannel");
const logger = require("../utils/logger");

// The new channels can be added here 
class NotificationService {
  constructor() {
    this.channels = [
      new EmailChannel(),
    ];
  }

  async notifyPatientRegistered(patient) {
    const subject = "Registration Confirmed";
    const content = {
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
              body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, sans-serif; }
              .wrapper { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
              .header { background-color: #2563eb; padding: 32px 40px; text-align: center; }
              .header h1 { margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 0.5px; }
              .body { padding: 40px; color: #374151; }
              .body h2 { margin-top: 0; font-size: 20px; color: #111827; }
              .body p { line-height: 1.6; font-size: 15px; margin: 12px 0; }
              .badge { display: inline-block; background-color: #dbeafe; color: #1d4ed8; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin: 16px 0; }
              .footer { background-color: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header">
                <h1>Patient Registration</h1>
              </div>
              <div class="body">
                <h2>Welcome, ${patient.name}!</h2>
                <p>Your registration has been successfully completed.</p>
                <span class="badge">✓ Registration Confirmed</span>
                <p>Thank you for trusting us with your health.</p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Patient Registration System. All rights reserved.
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Welcome, ${patient.name}! Your registration has been successfully completed.`,
    };

    for (const channel of this.channels) {
      try {
        await channel.send(patient.email, subject, content);
      } catch (err) {
        logger.error(`Notification failed via ${channel.constructor.name}: ${err.message}`);
      }
    }
  }
}

module.exports = new NotificationService();
