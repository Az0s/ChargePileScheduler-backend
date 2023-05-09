import Users from "../models/User.js";
import ChargingPiles, { ChargingPileStatus } from "../models/ChargingPile.js";
import ChargingQueue from "../models/ChargingQueue.js";
import ChargingRecord from "../models/ChargingRecord.js";
import ChargingRequest from "../models/ChargingRequest.js";
import FaultRecord from "../models/FaultRecord.js";
import ChargingPileStats, {
    IChargingPileStats,
} from "../models/ChargingPileStats.js";
import { IResponse } from "../IResponse.js";
import ChargingPile from "../models/ChargingPile.js";
import { handleChargingPileError } from "../utils/handleChargingPileError.js";

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
        const piles = await ChargingPiles.find().exec();
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
            code: 1,
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
        res.status(200).json({ code: 0, message: "success" });
        return;
    } catch (error) {
        res.status(500).json({ code: -1, message: "服务器错误" });
    }
};

export const getVehicleStatus = async (req, res) => {
    try {
        const data = [
            {
                userId: "1",
                batteryCapacity: 100,
                requestAmount: 20,
                queueTime: "30分钟",
            },
        ]; // 省略查询逻辑
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "服务器错误" });
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
    chargingPileId: number;
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
    try {
        const queues = await ChargingQueue.find().exec();
        const queueDataPromises = queues.map(async (queueItem) => {
            const request = await ChargingRequest.findOne({
                requestId: queueItem.requestId,
            }).exec();
            const user = await Users.findOne({
                userId: request?.userId,
            }).exec();
            //    const pile = await ChargingPiles.findOne({
            //        chargingPileId: queueItem.chargingPileId,
            //    }).exec();

            const currentTime = new Date();
            const waitingTime =
                (currentTime.getTime() - request?.requestTime.getTime()) / 1000; // Convert milliseconds to seconds

            return {
                batteryAmount: request?.batteryAmount ?? 0,
                //! WARNING 等待区队列中无chargingPileId
                //    chargingPileId: queueItem.chargingPileId,
                requireAmount: request?.requestVolume ?? 0,
                username: user?.username ?? "",
                waitingTime: waitingTime,
            } as QueueDatum;
        });

        const queueData = await Promise.all(queueDataPromises);
        res.json({
            code: 1,
            message: "success",
            data: queueData,
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
    chargingPileId: number;
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

};
