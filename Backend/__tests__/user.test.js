require("dotenv").config();
const db = require("../config/database");

describe("Database Tests", () => {
  afterAll(() => {
    db.end();
  });

  test("Should fetch users from user table", (done) => {
    db.query("SELECT * FROM user LIMIT 1", (err, results) => {
      expect(err).toBeNull();
      expect(Array.isArray(results)).toBe(true);
      done();
    });
  });

  // test("Should insert a new user", (done) => {
  //   const user = { name: "Test User", email: "test@example.com", password: "secret" };

  //   db.query(
  //     "INSERT INTO user (user_name, user_email, user_password) VALUES (?, ?, ?)", 
  //     [user.name, user.email, user.password],
  //     (err, results) => {
  //       expect(err).toBeNull();
  //       expect(results.affectedRows).toBe(1);
  //       done();
  //     }
  //   );
  // });
});
