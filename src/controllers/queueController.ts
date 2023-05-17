import users from "../models/User.js";
import ChargingPiles from "../models/ChargingPile.js";
import ChargingQueues from "../models/ChargingQueue.js";
import ChargingRecords from "../models/ChargingRecord.js";
import ChargingRequests, {
    ChargingRequestStatus,
} from "../models/ChargingRequest.js";
import ChargingStats from "../models/ChargingStats.js";
import { ResponseData, IResponse } from "../IResponse.js";

import faultRecord from "../models/FaultRecord.js";
import { ClientRequest } from "http";
import dispatch from "../utils/dispatch.js";
type QueueInfo = {
    chargeId: string;
    queueLen: number;
    curState: "NOTCHARGING" | "WAITINGSTAGE1" | "WAITINGSTAGE2" | "CHARGING";
    place: string; // WAITINGPLACE | ChargingPileId
};
/**
 *
 * @param req
 * NOTCHARGING 表示没有充电请求
 * WAITINGSTAGE1 表示在等候区等待
 * WAITINGSTAGE2 表示在充电区等待
 * CHARGING 表示正在充电
 * @param res
 */
export const getQueueInfo = async (req, res: IResponse<QueueInfo>) => {
    try {
        const { userId } = req;
        // find in chargingRequest that has status of neither 'canceled' nor 'finished'
        const request = await ChargingRequests.find({
            userId: userId,
            status: {
                $nin: [
                    ChargingRequestStatus.canceled,
                    ChargingRequestStatus.finished,
                ],
            },
        }).sort({ requestTime: -1 });
        if (request.length > 1) {
            console.error("user has multiple request that is in active state");
        }
        // notcharging
        if (request.length == 0) {
            res.json({
                code: 0,
                message: "success",
                data: {
                    chargeId: "NOTCHARGING",
                    queueLen: 0,
                    curState: "NOTCHARGING",
                    place: "NOTCHARGING",
                } as QueueInfo,
            });
            return;
        } else if (request[0].status == ChargingRequestStatus.pending) {
            // WAITINGSTAGE1
            const queue = await ChargingQueues.findOne({ userId: userId });
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
                    chargeId: `${queue.requestType}${queue.queueNumber}`,
                    queueLen: +queue.requestId,
                    curState: "WAITINGSTAGE1",
                    place: "WAITINGPLACE",
                } as QueueInfo,
            });
        } else if (request[0].status == ChargingRequestStatus.dispatched) {
            // find one pile that has {requestId: request[0].requestId} in chargingPile.queue`
            const pile = await ChargingPiles.findOne({
                chargingType: request[0].requestMode,
                "queue.requestId": request[0].requestId,
            }).exec();
            const queueIndex = pile.queue.findIndex(
                (item) => item.requestId == request[0].requestId
            );
            if (queueIndex == -1) {
                res.status(500).json({
                    code: -1,
                    message:
                        "error while trying to fetch user from queue in the pile",
                });
                throw new Error(
                    "error while trying to fetch user from queue in the pile"
                );
            }

            res.json({
                code: 0,
                message: "success",
                data: {
                    chargeId: "WAITINGSTAGE2",
                    queueLen: queueIndex,
                    curState: "WAITINGSTAGE2",
                    place: pile.chargingPileId,
                } as QueueInfo,
            });
        } else if (request[0].status == ChargingRequestStatus.charging) {
            // find one pile that has {requestId: request[0].requestId} in chargingPile.queue`
            const pile = await ChargingPiles.findOne({
                chargingType: request[0].requestMode,
                "queue.requestId": request[0].requestId,
            }).exec();
            res.json({
                code: 0,
                message: "success",
                data: {
                    chargeId: "CHARGING",
                    queueLen: 0,
                    curState: "CHARGING",
                    place: pile.chargingPileId,
                } as QueueInfo,
            });
        } else {
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

export const changeChargingRequest = async (req, res: IResponse<null>) => {
    const userId = req.userId;
    const { chargingAmount, chargingMode } = req.body;
    if (
        !chargingAmount ||
        !chargingMode ||
        !["F", "T"].includes(chargingMode)
    ) {
        res.status(200).json({
            code: -1,
            message: "缺少参数",
        });
        return;
    }
    try {
        const chargingRequest = await ChargingRequests.findOne({
            userId: userId,
            status: ChargingRequestStatus.pending,
        }).exec();
        if (!chargingRequest) {
            throw new Error("无可修改的请求或正尝试修改非pending状态的请求");
        }
        const requestId = chargingRequest.requestId;

        const newRequestData: Partial<typeof chargingRequest> = {
            requestMode: chargingMode || chargingRequest.requestMode,
            requestVolume: chargingAmount || chargingRequest.requestVolume,
        };

        if (chargingMode && chargingMode !== chargingRequest.requestMode) {
            // Remove the request from the old queue
            await ChargingQueues.findOneAndRemove({ requestId }).exec();

            // Add the request to the new queue with a new queue number
            const lastQueueNumber = await ChargingQueues.find({
                requestType: newRequestData.requestMode,
            })
                .sort("-queueNumber")
                .limit(1)
                .exec();

            const newQueueNumber =
                lastQueueNumber.length > 0
                    ? lastQueueNumber[0].queueNumber + 1
                    : 1;

            const newQueueData = {
                userId,
                requestId,
                requestType: newRequestData.requestMode,
                queueNumber: newQueueNumber,
                requestTime: chargingRequest.requestTime,
                requestVolume: newRequestData.requestVolume,
            };

            await ChargingQueues.create(newQueueData);
        } else {
            await ChargingQueues.updateOne(
                { requestId },
                newRequestData
            ).exec();
        }

        // Update the charging request with the new data
        await ChargingRequests.updateOne({ requestId }, newRequestData).exec();
        await dispatch();
        res.status(200).json({
            code: 0,
            message: "修改成功",
        });
    } catch (error) {
        res.status(200).json({
            code: -1,
            message: error.message,
        });
    }
};
