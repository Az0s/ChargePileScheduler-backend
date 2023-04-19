import { describe, expect, test } from "@jest/globals";
import * as queueController from "../queueController";

describe("queueController", () => {
    describe("getQueueInfo", () => {
        let res;
        beforeEach(() => {
            // Mock response object
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
        });
        it("should respond with queue information", () => {
            // Mock request data
            const req = {};

            // Call getQueueInfo function
            queueController.getQueueInfo(req, res);
            // Expect response to contain data object
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Object),
            });
        });
    });

    describe("changeChargingRequest", () => {
        let res;
        beforeEach(() => {
            // Mock response object
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
        });
        it("should respond with success message on successful modification", () => {
            // Mock request data
            const req = {
                body: {
                    type: "chargingMode",
                    value: "slow",
                },
            };
            // Mock response object

            // Call changeChargingRequest function
            queueController.changeChargingRequest(req, res);
            // Expect response to contain success message
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "修改成功",
            });
        });

        it("should respond with error message on invalid request data", () => {
            // Mock request data
            const req = {
                body: {
                    type: "invalidType",
                    value: "",
                },
            };
            // Mock response object

            // Call changeChargingRequest function
            queueController.changeChargingRequest(req, res);
            // Expect response to contain error message
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "请求数据不合法",
            });
        });
    });
});
