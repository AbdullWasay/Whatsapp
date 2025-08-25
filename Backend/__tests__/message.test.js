const request = require("supertest");
const { app, server } = require("../server");
const db = require("../config/database");
const jwt = require("jsonwebtoken");

// Dummy JWT for testing (replace with a valid userId)
const testUserId = 2;
const testToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET);

// Example chat ID (should exist in your test DB and include testUserId as a member)
const testChatId = 1; 
const nonMemberChatId = 99999; // ID that testUserId is NOT a member of

afterAll(() => {
  server.close();
  db.end();
});

describe("Messages Route", () => {

  describe("GET /api/messages/:chatId", () => {

    it("should return messages for a chat if user is a member", async () => {
      const res = await request(app)
        .get(`/api/messages/${testChatId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Check that each message has required properties
      res.body.forEach(msg => {
        expect(msg).toHaveProperty("_id");
        expect(msg).toHaveProperty("senderId");
        expect(msg).toHaveProperty("content");
        expect(msg).toHaveProperty("chatId", testChatId);
        expect(msg).toHaveProperty("createdAt");
        expect(msg).toHaveProperty("status", "read");
        expect(msg).toHaveProperty("messageType", "text");
        expect(msg).toHaveProperty("fileUrl", "");
      });
    });

    it("should return 404 if user is not a member of the chat", async () => {
      const res = await request(app)
        .get(`/api/messages/${nonMemberChatId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("message", "Chat not found");
    });

  });

});
