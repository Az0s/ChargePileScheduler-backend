import users from "../models/User.js";
import chargingPiles from "../models/ChargingPile.js";
import chargingQueue from "../models/ChargingQueue.js";
import ChargingRecords, { IChargingRecord } from "../models/ChargingRecord.js";
import chargingRequest from "../models/ChargingRequest.js";
import chargingStats from "../models/ChargingStats.js";
import faultRecord from "../models/FaultRecord.js";
import {IResponse} from "../IResponse.js";


export interface Datum {
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
export const getChargingReport = async (req, res: IResponse) => {
    const userId = req.userId;

    try {
        const userChargingRecords = await ChargingRecords.find({
            userId: userId,
        }).exec();

        const responseData: Datum[] = userChargingRecords.map(
            (record: IChargingRecord) => ({
                chargingFee: record.chargingFee,
                chargingPileId: record.chargingPileId,
                chargingTime:
                    (new Date(record.endTime).getTime() -
                        new Date(record.startTime).getTime()) /
                    1000,
                createTime: record.startTime,
                endTime: record.endTime,
                orderId: record.recordId,
                serviceFee: record.serviceFee,
                startTime: record.startTime,
                time: record.startTime.toISOString(),
                totalFee: record.totalFee,
                userId: record.userId,
                volume: record.volume,
            })
        );

        res.status(200).json({
            code: 0,
            data: responseData,
            message: "查询成功",
        });
    } catch (error) {
        res.status(500).json({
            code: -1,
            data: [],
            message: "查询失败",
        });
    }
};
