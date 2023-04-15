const request = require("supertest");

const app = require("../app");

// const server = require("../server");

describe("server runs", () => {
    it("hello data", async () => {
        await request(app).get("/api/hello").expect(200, "hello");
        // expect(response).toMatchObject("hello");
    });
});
