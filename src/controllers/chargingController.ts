import chargingPiles, { IChargingPile } from "../models/ChargingPile.js";
import chargingQueue from "../models/ChargingQueue.js";
// import chargingRecord, { IChargingRecord } from "../models/ChargingRecord.js";
import chargingRequest, {
    ChargingRequestStatus
} from "../models/ChargingRequest.js";
import { ResponseData, IResponse } from "../IResponse.js";
import dispatch, { getDispatchFlag } from "../utils/dispatch.js";
import { getDate, getTimestamp } from "../utils/timeService.js";
import { v4 as uuidv4 } from "uuid";
import handleChargingEnd, {
    ChargingResponseData,
} from "../utils/handleChargingEnd.js";

export const requestCharging = async (
    req,
    res: IResponse<{ queueId: string }>
) => {
    const { userId } = req;
    const { chargingMode, chargingAmount, batteryAmount } = req.body;
    let queueNumber = null;
    try {
        if (!chargingMode || !chargingAmount) {
            throw new Error("MISSING_REQUIRED_PARAMETER");
        } else if (!["F", "T"].includes(chargingMode)) {
            throw new Error("INVALID_CHARGING_MODE");
        } else if (batteryAmount < chargingAmount) {
            throw new Error("ERROR_PARAMETER")
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
            // all incoming request set to suspend when chargingPile failure is present
            status: getDispatchFlag()
                ? ChargingRequestStatus.pending
                : ChargingRequestStatus.suspend,
            requestTime: getDate(),
            requestMode: chargingMode,
            requestVolume: chargingAmount,
            batteryAmount,
        });
        await Promise.all([pQueue, pRequest]);
        await dispatch();
        res.json({
            code: 0,
            message: "请求成功",
            data: { queueId: chargingMode + queueNumber },
        });
        return;
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
        // console.error(error);
        res.status(400).json({
            code: -1,
            message: "排队失败: " + error.message,
        });
        return;
    } finally {
        // session.endSession();
    }
};

export const submitChargingResult = async (
    req,
    res: IResponse<ChargingResponseData>
) => {
    const { userId } = req;
    try {
        const responseData = await handleChargingEnd(userId);
        res.json({
            code: 0,
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

export const cancelCharging = async (req, res: IResponse<null>) => {
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
        try {
            const request = await chargingRequest.findOne({
                userId: req.userId,
                status: ChargingRequestStatus.dispatched,
            });
            if (request) {
                await chargingPiles.updateOne(
                    {},
                    { $pull: { queue: { requestId: request.requestId } } },
                    { multi: true }
                );
                await chargingRequest.updateOne(
                    { requestId: request.requestId },
                    { $set: { status: ChargingRequestStatus.canceled } }
                );
                res.json({ code: 0, message: "取消成功" });
            } else {
                console.log({
                    userId: req.userId,
                    status: ChargingRequestStatus.pending,
                });
                res.status(400).json({
                    code: -1,
                    message: "未找到正在排队区等候的请求，可能是已在充电区排队",
                });
            }
        } catch (err) {
            console.error("服务器错误 err while deleting from charging pile queue", err)
            res.status(500).json({
                code: -1,
                message:
                    "参数错误",
            });
        }
    } else {
        res.status(400).json({ code: -1, message: "用户不在排队中" });
    }
};

export const getRemainAmount = async (
    req,
    res: IResponse<{ amount: number }>
) => {
    const { userId } = req;
    try {
        // 查找用户当前正在进行的充电请求
        const request = await chargingRequest
            .findOne({
                userId: userId,
                status: ChargingRequestStatus.charging,
            })
            .exec();

        if (!request) {
            res.json({
                code: -1,
                message: "No active charging request found for this user.",
            });
            return;
        }

        // 计算已充电量
        const now = getDate();
        const startTime = request.startTime;
        const elapsedTime =
            (now.getTime() - startTime.getTime()) / 1000 / 60 / 60;
        const chargingPile = await chargingPiles
            .findOne({ "queue.requestId": request.requestId })
            .exec();
        const chargedAmount = elapsedTime * chargingPile.chargingPower;
        // console.log({
        //     requestVolumn: request.requestVolume,
        //     chargedAmount: chargedAmount,
        //     elapsedTime,
        //     nowTime: now.getTime(),
        //     startTime: startTime.getTime(),
        // });
        // 计算剩余充电量
        const remainingAmount = Math.max(
            request.requestVolume - chargedAmount,
            0
        );

        res.json({
            code: 0,
            message: "success",
            data: {
                amount: remainingAmount,
            },
        });
    } catch (error) {
        console.error(error);
        res.json({
            code: -1,
            message:
                "Error while fetching remaining charging amount: " +
                error.message,
        });
    }
};
