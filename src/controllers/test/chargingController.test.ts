import { describe, expect, test } from "@jest/globals";
import * as chargingController from "../chargingController";

describe("chargingController", () => {
    describe("requestCharging", () => {
        let res;
        beforeEach(() => {
            // Mock response object
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
        });
        it("should respond with queue number on successful request", () => {
            // Mock request data
            const req = {
                body: {
                    chargingMode: "fast",
                    requestAmount: 50,
                },
            };
            // Call requestCharging function
            chargingController.requestCharging(req, res);
            // Expect response to contain queueNumber
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "请求成功",
                queueNumber: expect.any(String),
            });
        });

        it("should respond with error message on invalid request data", () => {
            // Mock request data
            const req = {
                body: {
                    chargingMode: "invalid",
                    requestAmount: 0,
                },
            };

            // Call requestCharging function
            chargingController.requestCharging(req, res);
            // Expect response to contain error message
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "请求数据不合法",
            });
        });
    });

    describe("submitChargingResult", () => {
          let res;
          beforeEach(() => {
              // Mock response object
              res = {
                  status: jest.fn().mockReturnThis(),
                  json: jest.fn(),
              };
          });
        it("should respond with success message on successful submission", () => {
            // Mock request data
            const req = {
                body: {
                    stationId: "A",
                    chargeAmount: 50,
                    chargeDuration: "1小时",
                    chargeFee: 100,
                    serviceFee: 10,
                    totalFee: 110,
                },
            };
            // Call submitChargingResult function
            chargingController.submitChargingResult(req, res);
            // Expect response to contain success message
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "提交成功",
            });
        });

        it("should respond with error message on invalid request data", () => {
            // Mock request data
            const req = {
                body: {
                    stationId: "",
                    chargeAmount: 0,
                    chargeDuration: "",
                    chargeFee: -1,
                    serviceFee: -1,
                    totalFee: -2,
                },
            };
            // Call submitChargingResult function
            chargingController.submitChargingResult(req, res);
            // Expect response to contain error message
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "请求数据不合法",
            });
        });
    });

    describe("cancelCharging", () => {
          let res;
          beforeEach(() => {
              // Mock response object
              res = {
                  status: jest.fn().mockReturnThis(),
                  json: jest.fn(),
              };
          });
        it("should respond with success message on successful cancellation", () => {
            const req = {}
            // Call cancelCharging function
            chargingController.cancelCharging(req, res);
            // Expect response to contain success message
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "取消成功",
            });
        });
    });
});
