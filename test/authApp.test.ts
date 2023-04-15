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
// jest.setTimeout();
describe("app", () => {
    it("register ok", async () => {
        const res = await request(app).post("/api/auth/register").send({
            username: "register",
            password: "register",
        });
        expect(res.body).toMatchObject(responses.registerSuccessful);
    });
    it("register fail: already registered", async () => {
        const res = await request(app).post("/api/auth/register").send({
            username: "register",
            password: "register",
        });
        expect(res.body).toMatchObject(responses.badRegister);
    });
    it("login fail: unexisted user", async () => {
        const response = await request(app).post("/api/auth/login").send({
            username: "test",
            password: "qwer1234",
        });
        // .expect(404, responses.userNotFound);
        // or use
        expect(response.body).toMatchObject(responses.userNotFound);
    });
    it("login fail: bad password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            username: "register",
            password: "IForgotMyPassword",
        });
        expect(res.body).toMatchObject(responses.badPassword);
    });
    it("login success", async () => {
        // not register again when reserves db data between each tests
        /*
        await request(app).post("/api/auth/register").send({
            username: "register",
            password: "register",
        });
        */
        const res = await request(app).post("/api/auth/login").send({
            username: "register",
            password: "register",
        });
        // expect(res.status).toBe(200);
        expect(res.status).toBe(200);
    });
    it("jwt auth ok", async () => {
        const res = await request(app).post("/api/auth/login").send({
            username: "register",
            password: "register",
        });
        const authorization = "Bearer " + res.body.data.accessToken;
        const auth_res = await request(app)
            .post("/api/auth/auth")
            .set({ Authorization: authorization });
        expect(auth_res.body).toMatchObject({
            status: "success",
            data: {},
            message: "valid jwt.",
        });
        // expect(token.split(" ")[0]).toEqual("Bearer");
    });
    it("updates password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            username: "register",
            password: "register",
        });
        const pwd_res = await request(app)
            .post("/api/auth/reset-password")
            .set({ Authorization: "Bearer " + res.body.data.accessToken })
            .send({
                password: "register",
                new_password: "new_register",
            });
        expect(pwd_res.body).toMatchObject(responses.updatePwdOk);
    });
});