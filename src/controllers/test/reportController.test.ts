import { describe, expect, test } from "@jest/globals";
import * as reportController from "../reportController";

describe("reportController", () => {
    describe("getChargingReport", () => {
        let res;
        beforeEach(() => {
            // Mock response object
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
        });
        it("should respond with charging report data", () => {
            // Mock request data
            const req = {
                query: {
                    startDate: "2022-01-01",
                    endDate: "2022-01-31",
                },
            };
            // Call getChargingReport function
            reportController.getChargingReport(req, res);
            // Expect response to contain data array
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Array),
            });
        });

        it("should respond with error message on invalid request data", () => {
            // Mock request data
            const req = {
                query: {
                    startDate: "",
                    endDate: "",
                },
            };
            // Call getChargingReport function
            reportController.getChargingReport(req, res);
            // Expect response to contain error message
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "请求数据不合法",
            });
        });
    });
});
