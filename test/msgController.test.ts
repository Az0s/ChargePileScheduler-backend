const request = require("supertest");
const app = require("../app");
const responses = require("../responses");
const db = require("../utils/memory_db");
/**
 * connect to database in memory before all tests
 */

beforeAll(async () => {
    await db.connect();
});
// afterEach(async () => {
//     await db.clearDatabase();
// });
afterAll(async () => {
    await db.disconnect();
});

describe("app", () => {
    it("add message", async () => {
        const res = await request(app).post("/api/messages/addmsg").send({
            from: "register",
            message: "register",
        });
        expect(res.body).toMatchObject(responses.unauthorized);
    });
});
