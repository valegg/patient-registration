/**
 * Abstract base class for notification channels.
 * 
 * This class is prepared to be extended an be used for different channels
 */
class NotificationChannel {
  /**
   * @param {string} recipient
   * @param {string} subject
   * @param {{ text?: string, html?: string }} content
   */
  async send(recipient, subject, content) {
    throw new Error(`${this.constructor.name} must implement send()`);
  }
}

module.exports = NotificationChannel;
