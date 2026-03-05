const request = require("supertest");
const express = require("express");
const rateLimit = require("express-rate-limit");

// Instantiate a fresh limiter with max=1 to test the 429 behavior independently
// of the NODE_ENV guard in the production middleware
function buildTestApp(max = 1) {
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { errors: ["Too many registration attempts. Please try again later."] },
  });

  const app = express();
  app.post("/register", limiter, (req, res) => res.json({ ok: true }));
  return app;
}

describe("registrationLimiter", () => {
  test("allows requests under the limit", async () => {
    const app = buildTestApp(2);
    const res = await request(app).post("/register");
    expect(res.status).toBe(200);
  });

  test("returns 429 when limit is exceeded", async () => {
    const app = buildTestApp(1);
    const agent = request.agent(app);

    await agent.post("/register");
    const res = await agent.post("/register");

    expect(res.status).toBe(429);
  });

  test("returns correct error body on 429", async () => {
    const app = buildTestApp(1);
    const agent = request.agent(app);

    await agent.post("/register");
    const res = await agent.post("/register");

    expect(res.body.errors).toContain("Too many registration attempts. Please try again later.");
  });

  test("includes rate limit headers in response", async () => {
    const app = buildTestApp(5);
    const res = await request(app).post("/register");

    expect(res.headers).toHaveProperty("ratelimit-limit");
    expect(res.headers).toHaveProperty("ratelimit-remaining");
  });
});
