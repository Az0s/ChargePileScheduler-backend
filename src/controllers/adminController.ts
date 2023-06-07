import Users, { IUser } from "../models/User.js";
import ChargingPileModel, {
    ChargingPileStatus,
    IChargingPile,
} from "../models/ChargingPile.js";
import ChargingQueue from "../models/ChargingQueue.js";
import ChargingRecordModel from "../models/ChargingRecord.js";
import ChargingRequestModel, {
    IChargingRequest,
    ChargingRequestStatus,
} from "../models/ChargingRequest.js";
import FaultRecord from "../models/FaultRecord.js";
import ChargingPileStats, {
    IChargingPileStats,
} from "../models/ChargingPileStats.js";
import { IResponse } from "../IResponse.js";
import ChargingPile from "../models/ChargingPile.js";
import { handleChargingPileError } from "../utils/handleChargingPileError.js";
import { getDate, getTimestamp } from "../utils/timeService.js";
import dispatch from "../utils/dispatch.js";

export interface ChargingStationStatusDatum {
    /**
     * 充电桩编号
     */
    chargingPileId: string;
    /**
     * 充电桩累计充电电量（单位：KWh）
     */
    cumulativeChargingAmount: number;
    /**
     * 充电桩累计充电时间（单位：小时）
     */
    cumulativeChargingTime: number;
    /**
     * 充电桩累计使用次数
     */
    cumulativeUsageTimes: number;
    /**
     * 充电桩状态
     */
    status: ChargingPileStatus;
}

export const getChargingPileStatus = async (
    req,
    res: IResponse<ChargingStationStatusDatum[]>
) => {
    try {
        const piles = await ChargingPileModel.find().exec();
        const pileStatusPromises = piles.map(async (pile) => {
            const stats = await ChargingPileStats.findOne({
                chargingPileId: pile.chargingPileId,
            }).exec();

            return {
                chargingPileId: pile.chargingPileId,
                cumulativeChargingAmount: stats?.totalChargingVolume ?? 0,
                cumulativeChargingTime:
                    (stats?.totalChargingDuration ?? 0) / 3600, // Convert seconds to hours
                cumulativeUsageTimes: stats?.totalChargingSessions ?? 0,
                status: pile.status,
            } as ChargingStationStatusDatum;
        });

        const chargingStationStatusData = await Promise.all(pileStatusPromises);
        res.json({
            code: 0,
            message: "success",
            data: chargingStationStatusData,
        });
    } catch (error) {
        console.error(error);
        res.json({
            code: -1,
            message:
                "error while getting charging pile status. " + error.message,
        });
    }
};

export const updateChargingPile = async (
    req,
    res: IResponse<{
        /**
         * 充电桩号
         */
        chargingPileId: number;
        /**
         * 充电桩状态
         */
        status: ChargingPileStatus;
    }>
) => {
    const { status, chargingPileId } = req.body;
    // 验证数据
    if (
        !chargingPileId ||
        !status ||
        !Object.values(ChargingPileStatus).includes(
            status as ChargingPileStatus
        )
    ) {
        res.status(200).json({ code: -1, message: "缺少必要参数或参数错误" });
        return;
    }
    // 操作充电桩
    try {
        await ChargingPile.findOneAndUpdate(
            { chargingPileId },
            { status: status as ChargingPileStatus }
        ).exec();
        if (status !== ChargingPileStatus.running) {
            await handleChargingPileError(chargingPileId);
        }
        await dispatch();
        res.status(200).json({ code: 0, message: "success" });
        return;
    } catch (error) {
        res.status(500).json({ code: -1, message: "服务器错误" });
    }
};

export interface QueueDatum {
    /**
     * 电池容量（单位：KWh 精确到2位小数）
     */
    batteryAmount: number;
    /**
     * 充电桩编号
     */
    chargingPileId: string;
    /**
     * 请求充电量（单位：KWh 精确到2位小数）
     */
    requireAmount: number;
    /**
     * 用户名
     */
    username: string;
    /**
     * 已等待时间（单位：秒）
     */
    waitingTime: number;
}

export const getQueueStatus = async (req, res: IResponse<QueueDatum[]>) => {
    const constructDatum = (
        user: IUser,
        request: IChargingRequest,
        chargingPile = undefined
    ) => {
        const currentTime = getDate();
        const waitingTime =
            (currentTime.getTime() - request?.requestTime.getTime()) / 1000; // Convert milliseconds to seconds
        return {
            batteryAmount: request?.batteryAmount ?? 0,
            //! WARNING 等待区队列中无chargingPileId
            // TODO 处理chargingPileId
            chargingPileId:
                chargingPile === undefined
                    ? "WAITINGPLACE"
                    : chargingPile.chargingPileId,
            requireAmount: request?.requestVolume ?? 0,
            username: user?.username ?? "",
            waitingTime: waitingTime,
        } as QueueDatum;
    };
    try {
        const queues = await ChargingQueue.find().exec();
        const data_from_queue = queues.map(async (queueItem) => {
            const request = await ChargingRequestModel.findOne({
                requestId: queueItem.requestId,
            }).exec();
            const user = await Users.findOne({
                userId: request?.userId,
            }).exec();
            //    const pile = await ChargingPiles.findOne({
            //        chargingPileId: queueItem.chargingPileId,
            //    }).exec();
            return constructDatum(user, request);
        });
        // 查找所有充电桩
        const chargingPiles: IChargingPile[] = await ChargingPileModel.find();
        const data_from_pile: Promise<QueueDatum>[] = chargingPiles.map(
            async (chargingPile) => {
                // 检查充电桩队列中是否有等待充电的用户
                //! WARNING assert chargingPile.maxQueue == 2
                if (chargingPile.queue.length > 1) {
                    const secondRequestIdInQueue =
                        chargingPile.queue[0].requestId;

                    // 查找与该请求ID关联的充电请求
                    const chargingRequests: IChargingRequest | null =
                        await ChargingRequestModel.findOne({
                            requestId: secondRequestIdInQueue,
                        });
                    const user = await Users.findOne({
                        userId: chargingRequests?.userId,
                    }).exec();
                    if (chargingRequests) {
                        return constructDatum(
                            user,
                            chargingRequests,
                            chargingPile
                        );
                    } else if (!chargingRequests) {
                        //
                        console.error(
                            ` database record not found when tring to find charging request(requestId: ${secondRequestIdInQueue}) from the head of chargingPile(Id:${chargingPile.chargingPileId})`
                        );
                    } else {
                    }
                }
            }
        );
        const queueData = await Promise.all([
            ...data_from_queue,
            ...data_from_pile,
        ]);
        // console.log();
        res.json({
            code: 0,
            message: "success",
            data: queueData.filter((item) => item !== undefined),
        });
    } catch (error) {
        console.error(error);
        res.json({
            code: -1,
            message: "error while getting queue status. " + error.message,
        });
    }
};

/**
 * 报表
 */
export interface ReportDatum {
    /**
     * 充电桩编号
     */
    chargingPileId: string;
    /**
     * 累计充电量（单位：KWh 精确到2位小数）
     */
    cumulativeChargingAmount: number;
    /**
     * 累计充电费用（单位：元 精确到2位小数）
     */
    cumulativeChargingFee: number;
    /**
     * 累计充电时长（单位：小时）
     */
    cumulativeChargingTime: number;
    /**
     * 累计总费用（单位：元 精确到2位小数）
     */
    cumulativeFee: number;
    /**
     * 累计服务费用（单位：元 精确到2位小数）
     */
    cumulativeServiceFee: number;
    /**
     * 累计使用次数
     */
    cumulativeUsageTimes: number;
    /**
     * 天
     */
    day: number;
    /**
     * 月
     */
    month: number;
    /**
     * 周
     */
    week: number;
}
export const getReport = async (req, res: IResponse<ReportDatum[]>) => {
    try {
        const piles = await ChargingPileModel.find().exec();
        const pileStatusPromises = piles.map(async (pile) => {
            const stats = await ChargingPileStats.findOne({
                chargingPileId: pile.chargingPileId,
            }).exec();
            // calculate the difference between the earliest chargingRecord and now
            const earliestRecord = await ChargingRecordModel.findOne({
                chargingPileId: pile.chargingPileId,
            })
                .sort({ startTime: 1 })
                .exec();
            const nowTime = getDate();
            const dayDiff = Math.floor(
                isNaN(
                    Math.abs(
                        nowTime.getTime() - earliestRecord?.startTime.getTime()
                    ) /
                        (1000 * 3600 * 24)
                )
                    ? 0
                    : Math.abs(
                          nowTime.getTime() -
                              earliestRecord?.startTime.getTime()
                      ) /
                          (1000 * 3600 * 24)
            );
            // console.log({
            //     dayDiff,
            //     earlyRecord: earliestRecord,
            // });
            const weekDiff = Math.floor(dayDiff / 7);
            const monthDiff = Math.floor(dayDiff / 30);

            const datum: ReportDatum = {
                chargingPileId: pile.chargingPileId,
                cumulativeChargingAmount: stats?.totalChargingVolume ?? 0,
                cumulativeChargingTime:
                    (stats?.totalChargingDuration ?? 0) / 3600, // Convert seconds to hours
                cumulativeUsageTimes: stats?.totalChargingSessions ?? 0,
                cumulativeFee: stats?.totalChargingFee ?? 0,
                cumulativeChargingFee: stats?.totalChargingFee ?? 0,
                cumulativeServiceFee: stats?.totalServiceFee ?? 0,
                day: dayDiff - weekDiff * 7 - monthDiff * 30,
                week: weekDiff - monthDiff * 4,
                month: monthDiff,
            };
            return datum;
        });

        const chargingStationStatusData = await Promise.all(pileStatusPromises);
        res.json({
            code: 0,
            message: "success",
            data: chargingStationStatusData,
        });
    } catch (error) {
        console.error(error);
        res.json({
            code: -1,
            message:
                "error while getting charging pile status. " + error.message,
        });
    }
};
