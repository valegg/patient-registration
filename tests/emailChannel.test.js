jest.mock("nodemailer");

const nodemailer = require("nodemailer");
const mockSendMail = jest.fn().mockResolvedValue({ messageId: "test-id" });
nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

const EmailChannel = require("../src/notifications/EmailChannel");

beforeEach(() => jest.clearAllMocks());

describe("EmailChannel.send", () => {
  const content = { html: "<p>Hello Jane</p>", text: "Hello Jane" };

  test("calls sendMail with correct recipient, subject and content", async () => {
    const channel = new EmailChannel();

    await channel.send("jane@example.com", "Welcome", content);

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        subject: "Welcome",
        html: "<p>Hello Jane</p>",
        text: "Hello Jane",
      })
    );
  });

  test("throws when sendMail fails", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("Connection refused"));
    const channel = new EmailChannel();

    await expect(channel.send("jane@example.com", "Welcome", content)).rejects.toThrow("Connection refused");
  });
});
