// import { describe, expect, test } from "@jest/globals";
// import * as authController from "../authController";

// describe("authController", () => {
//     describe("register", () => {
//         it("should respond with success message on successful registration", () => {
//             // Mock request data
//             const req = {
//                 body: {
//                     username: "testuser",
//                     password: "testpass",
//                     confirmPassword: "testpass",
//                     phoneNumber: "1234567890",
//                 },
//             };
//             // Mock response object
//             const res = {
//                 json: jest.fn(),
//             };
//             // Call register function
//             authController.register(req, res);
//             // Expect response to contain success message
//             expect(res.json).toHaveBeenCalledWith({
//                 success: true,
//                 message: "注册成功",
//             });
//         });

//         it("should respond with error message on invalid request data", () => {
//             // Mock request data
//             const req = {
//                 body: {
//                     username: "",
//                     password: "testpass",
//                     confirmPassword: "testpass",
//                     phoneNumber: "1234567890",
//                 },
//             };
//             // Mock response object
//             const res = {
//                 json: jest.fn(),
//             };
//             // Call register function
//             authController.register(req, res);
//             // Expect response to contain error message
//             expect(res.json).toHaveBeenCalledWith({
//                 success: false,
//                 message: "请求数据不合法",
//             });
//         });
//     });

//     describe("login", () => {
//         it("should respond with success message on correct login credentials", () => {
//             // Mock request data
//             const req = {
//                 body: {
//                     username: "testuser",
//                     password: "testpass",
//                 },
//             };
//             // Mock response object
//             const res = {
//                 json: jest.fn(),
//             };
//             // Call login function
//             authController.login(req, res);
//             // Expect response to contain success message
//             expect(res.json).toHaveBeenCalledWith({
//                 success: true,
//                 message: "登录成功",
//             });
//         });

//         it("should respond with error message on incorrect login credentials", () => {
//             // Mock request data
//             const req = {
//                 body: {
//                     username: "testuser",
//                     password: "wrongpass",
//                 },
//             };
//             // Mock response object
//             const res = {
//                 json: jest.fn(),
//             };
//             // Call login function
//             authController.login(req, res);
//             // Expect response to contain error message
//             expect(res.json).toHaveBeenCalledWith({
//                 success: false,
//                 message: "用户名或密码错误",
//             });
//         });
//     });
// });
