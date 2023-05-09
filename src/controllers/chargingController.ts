// import users from "../models/User.js";
import chargingPiles, { IChargingPile } from "../models/ChargingPile.js";
import chargingQueue from "../models/ChargingQueue.js";
import chargingRecord, { IChargingRecord} from "../models/ChargingRecord.js";
import chargingRequest, {
    ChargingRequestStatus,
    IChargingRequest,
} from "../models/ChargingRequest.js";
// import chargingStats from "../models/ChargingStats.js";
// import faultRecord from "../models/FaultRecord.js";
import { ResponseData, IResponse } from "../IResponse.js";
import dispatch from "../utils/dispatch.js";
import { getDate, getTimestamp } from "../utils/timer.js";
import { v4 as uuidv4 } from "uuid";
import { ClientRequest } from "http";

// chargingController.js
export const requestCharging = async (req, res: IResponse) => {
    const { userId } = req;
    const { chargingMode, chargingAmount, batteryAmount } = req.body;
    let queueNumber = null;
    try {
        if (!chargingMode || !chargingAmount) {
            throw new Error("MISSING_REQUIRED_PARAMETER");
        } else if (!["F", "T"].includes(chargingMode)) {
            throw new Error("INVALID_CHARGING_MODE");
        }
        // (!MAX_QUEUE_REACHED) && (!USER_ALREADY_IN_QUEUE)
        const [queueCount, userInQueue, userRequests] = await Promise.all([
            chargingQueue.countDocuments(),
            chargingQueue.findOne({ userId: userId }),
            chargingRequest.find({
                userId: userId,
                status: {
                    $nin: [
                        ChargingRequestStatus.canceled,
                        ChargingRequestStatus.finished,
                    ],
                },
            }),
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
            status: ChargingRequestStatus.pending,
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

interface ChargingResponseData {
    /**
     * 充电费用单位：元 精确到2位小数）
     */
    chargingFee: number;
    /**
     * 充电桩编号
     */
    chargingPileId: string;
    /**
     * 充电时长（单位：秒）
     */
    chargingTime: number;
    /**
     * 订单创建时间
     */
    createTime: Date;
    /**
     * 结束充电时间
     */
    endTime: Date;
    /**
     * 详单编号
     */
    orderId: string;
    /**
     * 服务费用单位：元 精确到2位小数）
     */
    serviceFee: number;
    /**
     * 开始充电时间
     */
    startTime: Date;
    /**
     * 当前时间戳
     */
    time: string;
    /**
     * 总费用单位：元 精确到2位小数）
     */
    totalFee: number;
    /**
     * 用户ID
     */
    userId: number;
    /**
     * 充电电量（单位：KWh 精确到2位小数）
     */
    volume: number;
}
export const submitChargingResult = async (req, res: IResponse) => {
    const { userId } = req;
    try {
        const request = await chargingRequest
            .findOne({
                userId: userId,
                status: ChargingRequestStatus.charging,
            })
            .exec();
        if (!request) {
            console.error("active charging request not found");
            throw new Error("active charging request not found");
        }
        const pile = await chargingPiles
            .findOne({
                userId: userId,
                "queue.requestId": request.requestId,
            })
            .exec();
        var responseData: ChargingResponseData;
        // 补充生成详单逻辑
        // 生成详单逻辑
        const endTime = getDate();
        const startTime = request.requestTime;
        const chargingTime = (endTime.getTime() - startTime.getTime()) / 1000;
        const volume = chargingTime * pile.chargingPower > request.batteryAmount? request.batteryAmount: chargingTime * pile.chargingPower;
        // TODO 单位随时间变化电价 暂时只有0.5元/KWh
        const chargingFee =volume * 0.5;
        const serviceFee = volume * 0.8;
        const totalFee = chargingFee + serviceFee;
        const orderId = "CD" + getDate().getTime().toString(); // 根据时间戳生成订单号
        responseData = {
            chargingFee: +chargingFee.toFixed(2),
            chargingPileId: pile.chargingPileId, 
            chargingTime,
            createTime: startTime,
            endTime,
            orderId,
            serviceFee: +serviceFee.toFixed(2),
            startTime,
            time: new Date().getTime().toString(),
            totalFee: +totalFee.toFixed(2),
            userId: userId,
            volume: +request.batteryAmount.toFixed(2),
        };
        // create new record in chargingRecord
        await Promise.all([ chargingRecord.create({
            userId: userId,
            recordId: orderId,
            chargingPileId: pile.chargingPileId,
            startTime: startTime,
            endTime: endTime,
            volume: volume,
            chargingFee: chargingFee,
            serviceFee: serviceFee,
            totalFee: totalFee,
        }),
        // update chargingRequest
         chargingRequest.updateOne(
            { requestId: request.requestId },
            { $set: { status: ChargingRequestStatus.finished } }
        ),
        // update chargingPiles. remove requestId from queue
         chargingPiles.updateOne(
            { chargingPileId: pile.chargingPileId },
            { $pop: { queue: 0} }
        )
        ])
        res.json({
            code: 1,
            message: "success",
            data: responseData,
        });
    } catch (error) {
        console.error(error);
        res.json({
            code: -1,
            message:
                "error while submitting charging request. " + error.message,
        });
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
                { $set: { status: ChargingRequestStatus.canceled } }
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
