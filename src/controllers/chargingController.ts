// import users from "../models/User.js";
import chargingPiles from "../models/ChargingPile.js";
import chargingQueue from "../models/ChargingQueue.js";
// import chargingRecord from "../models/ChargingRecord.js";
import chargingRequest, {
    ChargingRequestStatus,
} from "../models/ChargingRequest.js";
// import chargingStats from "../models/ChargingStats.js";
// import faultRecord from "../models/FaultRecord.js";
import { ResponseData, IResponse } from "../IResponse.js";
import dispatch from "../utils/dispatch.js";
import { getDate, getTimestamp } from "../utils/timer.js";
import { v4 as uuidv4 } from "uuid";

// chargingController.js
export const requestCharging = async (req, res: IResponse) => {
    const { userId } = req;
    const { chargingMode, chargingAmount, batteryAmount } = req.body;
    // 验证数据
    if (!chargingMode || !chargingAmount) {
        res.status(400).json({
            code: -1,
            message: "缺少必要参数",
        } as ResponseData);
        return;
    } else if (!["F", "T"].includes(chargingMode)) {
        res.status(400).json({
            code: -1,
            message: "充电模式错误 " + `expected: F or T, got: ${chargingMode}`,
        } as ResponseData);
        return;
    }
    // let session = null;
    let queueNumber = null;
    try {
        // (!MAX_QUEUE_REACHED) && (!USER_ALREADY_IN_QUEUE)
        const [queueCount, userInQueue, userRequests] = await Promise.all([
            chargingQueue.countDocuments(),
            chargingQueue.findOne({ userId: userId }),
            chargingRequest
            .find({
                userId: userId,
                status: {
                    $nin: [
                        ChargingRequestStatus.canceled,
                        ChargingRequestStatus.finished,
                    ],
                },
            })
        ]);
        if (queueCount >= 6) {
            throw new Error("MAX_QUEUE_REACHED");
        } else if (userInQueue) {
            throw new Error("USER_ALREADY_IN_QUEUE");
        } else if (userRequests.length != 0) {  
            // console.error("USER_ALREADY_HAS_ACTIVE_REQUEST", userRequests);
            throw new Error("USER_ALREADY_HAS_ACTIVE_REQUEST");
        }
        queueNumber =
            (await chargingQueue.countDocuments({
                requestType: chargingMode,
            })) + 1;
        const requestId = uuidv4();
        const pQueue = chargingQueue.create({
            userId,
            queueNumber,
            requestType: chargingMode,
            requestTime: getDate(),
            requestId,
            requestVolume: chargingAmount,
        });
        const pRequest = chargingRequest.create({
            userId,
            requestId,
            status:ChargingRequestStatus.pending,
            requestTime: getDate(),
            requestMode: chargingMode,
            requestVolume: chargingAmount,
            batteryAmount,
        });
        Promise.all([pQueue, pRequest]).then(() => {
            dispatch().then(() => {
                res.json({
                    code: 0,
                    message: "请求成功",
                    data: { queueId: chargingMode + queueNumber },
                } as ResponseData);
                return;
            });
        });
        /* //* transaction not used in this version. need to set up replica mongodb.
        // Start a new transaction
        session = await mongoose.startSession();
        session.startTransaction();

        // if MAX_QUEUE_REACHED
        const queueCount = await chargingQueue.countDocuments().session(session)
        if (queueCount >= 6) {
            // custom MAX_QUEUE_REACHED error
            throw new Error("MAX_QUEUE_REACHED");
        }
        const seiral =
            (await chargingQueue
                .countDocuments({
                    requestType: chargingMode,
                })
                .session(session));
        
        queueNumber = `${chargingMode}${seiral}`;

        // Insert new document into chargingQueue
        await chargingQueue.create(
            {
                queueNumber,
                requestType: chargingMode,
                chargingAmount,
                userId,
            },
            { session }
        );
        // Commit the transaction
        await session.commitTransaction();
        */
    } catch (error) {
        console.error(error);
        res.status(400).json({
            code: -1,
            message: "排队失败: " + error.message,
        } as ResponseData);
        return;
    } finally {
        // End the session
        // session.endSession();
    }
};

export const submitChargingResult = async (req, res: IResponse) => {
    const {
        chargingStationId,
        chargingAmount,
        chargingDuration,
        chargingFee,
        serviceFee,
        totalFee,
    } = req.body;
    // 验证数据
    if (
        !chargingStationId ||
        !chargingAmount ||
        !chargingDuration ||
        !chargingFee ||
        !serviceFee ||
        !totalFee
    ) {
        res.status(400).json({ code: -1, message: "缺少必要参数" });
        return;
    }
    // 提交结果
    try {
        // 省略提交逻辑
        res.json({ code: 0, message: "提交成功" });
    } catch (error) {
        res.status(500).json({ code: -1, message: "服务器错误" });
    }
};

export const cancelCharging = async (req, res: IResponse) => {
    // 如果在排队中，删除排队信息
    const queue = await chargingQueue.findOne({ userId: req.userId });
    //  queuing in waiting pool
    if (queue) {
        try {
            await chargingQueue.deleteOne({ userId: req.userId });
            await chargingRequest.updateOne(
                { requestId: queue.requestId },
                { $set: { status: ChargingRequestStatus.canceled} }
            );
            await dispatch();
            res.json({ code: 0, message: "取消成功" });
        } catch (err) {
            res.status(500).json({
                code: -1,
                message: "服务器错误 err while deleting queue",
            });
        }
    } else if (
        // queuing in charging piles
        await (async () => {
            const requestIdInPile = await chargingPiles.distinct(
                "queue.requestId"
            );
            const userIdsInPile = await chargingRequest
                .find({ requestId: { $in: requestIdInPile } })
                .distinct("userId");
            return userIdsInPile.includes(req.userId);
        })()
    ) {
        // TODO: 如果在充电队列中，删除充电队列记录
        res.status(500).json({
            code: -1,
            message: "not implemented",
        });
    } else {
        res.status(400).json({ code: -1, message: "用户不在排队中" });
    }
};
