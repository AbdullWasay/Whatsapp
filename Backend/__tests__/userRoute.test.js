const request = require("supertest");
const { app, server } = require("../server");
const db = require("../config/database");
const jwt = require("jsonwebtoken");

// Dummy JWT for testing (replace with valid userId)
const testUserId = 2;
const testToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET);

afterAll(() => {
  // Close the server and DB connection after tests
  server.close();
  db.end();
});

describe("User Routes", () => {

describe("GET /api/user", () => {
  it("should return list of users (LIMIT 5) excluding current user", async () => {
    const res = await request(app)
      .get("/api/user")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.statusCode).toBe(200);

    expect(Array.isArray(res.body)).toBe(true);

    // Each returned user should have an _id and must not be the logged-in user
    res.body.forEach(user => {
      expect(user).toHaveProperty("_id");
      expect(user._id).not.toBe(testUserId);
    });
  });
});



  describe("GET /api/user/search", () => {
    it("should return 400 if query is missing", async () => {
      const res = await request(app)
        .get("/api/user/search")
        .set("Authorization", `Bearer ${testToken}`);
      expect(res.statusCode).toBe(400);
    });

    it("should return search results for a valid query", async () => {
      const res = await request(app)
        .get("/api/user/search")
        .query({ query: "test" })
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/user/:userId", () => {
    it("should return user details by ID", async () => {
      const res = await request(app)
        .get(`/api/user/${testUserId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id", testUserId);
    });

    it("should return 404 for non-existing user", async () => {
      const res = await request(app)
        .get("/api/user/999999")
        .set("Authorization", `Bearer ${testToken}`);
      expect(res.statusCode).toBe(404);
    });
  });
});
