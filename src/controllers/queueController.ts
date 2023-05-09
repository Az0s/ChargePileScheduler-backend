import users from "../models/User.js";
import chargingPiles from "../models/ChargingPile.js";
import chargingQueue from "../models/ChargingQueue.js";
import chargingRecord from "../models/ChargingRecord.js";
import chargingRequest, {
    ChargingRequestStatus,
} from "../models/ChargingRequest.js";
import chargingStats from "../models/ChargingStats.js";
import { ResponseData, IResponse } from "../IResponse.js";

import faultRecord from "../models/FaultRecord.js";
import ChargingPile from "../models/ChargingPile.js";
import { ClientRequest } from "http";
/**
 *
 * @param req
 * NOTCHARGING 表示没有充电请求
 * WAITINGSTAGE1 表示在等候区等待
 * WAITINGSTAGE2 表示在充电区等待
 * CHARGING 表示正在充电
 * @param res
 */
export const getQueueInfo = async (req, res: IResponse) => {
    type QueueInfo = {
        chargeId: string;
        queueLen: number;
        curState:
            | "NOTCHARGING"
            | "WAITINGSTAGE1"
            | "WAITINGSTAGE2"
            | "CHARGING";
        place: string; // WAITINGPLACE | ChargingPileId
    };
    try {
        const { userId } = req;
        // find in chargingRequest that has status of neither 'canceled' nor 'finished'
        const request = await chargingRequest
            .find({
                userId: userId,
                status: {
                    $nin: [
                        ChargingRequestStatus.canceled,
                        ChargingRequestStatus.finished,
                    ],
                },
            })
            .sort({ requestTime: -1 });
        if (request.length >1) {
            console.error("user has multiple request that is in active state");
        }
        // notcharging
        if (request.length == 0) {
            res.json({
                code: 0,
                message: "success",
                data: {
                    chargeId: null,
                    queueLen: 0,
                    curState: "NOTCHARGING",
                    place: null,
                } as QueueInfo,
            });
            return;
        } else if (request[0].status == ChargingRequestStatus.pending) {
            // WAITINGSTAGE1
            const queue = await chargingQueue.findOne({ userId: userId });
            if (!queue) {
                res.status(500).json({
                    code: -1,
                    message: "error while trying to fetch user from queue",
                });
                throw new Error("error while trying to fetch user from queue");
            }

            res.json({
                code: 0,
                message: "success",
                data: {
                    chargeId: `${queue.requestType}${queue.requestId}`,
                    queueLen: +queue.requestId,
                    curState: "WAITINGSTAGE1",
                    place: "WAITINGPLACE",
                } as QueueInfo,
            });
        }
        else if (request[0].status == ChargingRequestStatus.dispatched) {
            // find one pile that has {requestId: request[0].requestId} in chargingPile.queue`
            const pile = await chargingPiles.findOne({
                chargingType: request[0].requestMode,
                "queue.requestId": request[0].requestId,
            }).exec();
            const queueIndex = pile.queue.findIndex(
                (item) => item.requestId == request[0].requestId
            );
            if (queueIndex == -1) {
                res.status(500).json({
                    code: -1,
                    message: "error while trying to fetch user from queue in the pile",
                })
                throw new Error("error while trying to fetch user from queue in the pile");
            }

             res.json({
                 code: 0,
                 message: "success",
                 data: {
                     chargeId: null,
                     queueLen: queueIndex,
                     curState: "WAITINGSTAGE2",
                     place: pile.chargingPileId,
                 } as QueueInfo,
             });
        }
        else if (request[0].status == ChargingRequestStatus.charging) {
            // find one pile that has {requestId: request[0].requestId} in chargingPile.queue`
            const pile = await chargingPiles.findOne({
                chargingType: request[0].requestMode,
                "queue.requestId": request[0].requestId,
            }).exec();
             res.json({
                 code: 0,
                 message: "success",
                 data: {
                     chargeId: null,
                     queueLen: 0,
                     curState: "CHARGING",
                     place: pile.chargingPileId,
                 } as QueueInfo,
             });
        }
        else {
            res.status(500).json({
                code: -1,
                message: "unknown status",
            });
            throw new Error("unknown status");
        }
    } catch (error) {
        res.status(500).json({ code: -1, message: "unknown error" });
    }
};

export const changeChargingRequest = async (req, res: IResponse) => {
    const { type, value } = req.body;
    // 验证数据
    if (!type || !value) {
        res.status(400).json({ code: -1, message: "not implemented" });
        return;
    }
    // 修改请求
    try {
        // 省略修改逻辑
        res.json({ code: -1, message: "not implemented" });
    } catch (error) {
        res.status(500).json({ code: -1, message: "not implemented" });
    }
};

// reportController.js
export const getChargingReport = async (req, res: IResponse) => {
    const { startTime, endTime, chargingStationId } = req.query;
    // 验证数据
    if (!startTime || !endTime) {
        res.status(400).json({ code: -1, message: "not implemented" });
        return;
    }
    // 查询报表
    try {
        const data = [
            {
                time: "2022-01-01",
                stationId: "A",
                chargeTimes: 10,
                chargeDuration: "1小时",
                chargeAmount: "100度",
                chargeFee: 100,
                serviceFee: 10,
                totalFee: 110,
            },
        ]; // 省略查询逻辑
        res.json({ code: -1, message: "not implemented" });
    } catch (error) {
        res.status(500).json({ code: -1, message: "not implemented" });
    }
};
