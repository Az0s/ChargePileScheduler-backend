import { describe, expect, test } from "@jest/globals";
import * as adminController from "../adminController";
describe("adminController", () => {
    describe("getChargingStationStatus", () => {
        let res;
        beforeEach(() => {
            // Mock response object
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
        });
        it("should respond with charging station status information", () => {
            // Mock request data
            const req = {};

            // Call getChargingStationStatus function
            adminController.getChargingPileStatus(req, res);
            // Expect response to contain data array
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Array),
            });
        });
    });

    describe("toggleChargingStation", () => {
        let res;
        beforeEach(() => {
            // Mock response object
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
        });
        it("should respond with success message on successful toggling", () => {
            // Mock request data
            const req = {
                body: {
                    stationId: "A",
                    action: "turnOn",
                },
            };

            // Call toggleChargingStation function
            adminController.updateChargingPile(req, res);
            // Expect response to contain success message
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "操作成功",
            });
        });

        it("should respond with error message on invalid request data", () => {
            // Mock request data
            const req = {
                body: {
                    stationId: "",
                    action: "invalidAction",
                },
            };

            // Call toggleChargingStation function
            adminController.updateChargingPile(req, res);
            // Expect response to contain error message
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "请求数据不合法",
            });
        });
    });

});
