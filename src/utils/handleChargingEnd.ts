import chargingPiles from "../models/ChargingPile.js";

import chargingRecord from "../models/ChargingRecord.js";
import chargingRequest, {
    ChargingRequestStatus,
} from "../models/ChargingRequest.js";
import { getDate } from "../utils/timeService.js";
import ChargingPileStats from "../models/ChargingPileStats.js";

/**
 * 计算充电费用，根据起始时间、结束时间和充电量。
 * 根据不同时间段的电价（峰时、平时和谷时）计算总充电费用。
 *
 * @param startTime 充电起始时间
 * @param endTime 充电结束时间
 * @param volume 充电量
 * @returns 总充电费用
 */
export function calculateChargingFee(
    startTime: Date,
    endTime: Date,
    volume: number
): number {
    let chargingFee = 0;
    let currentTime = new Date(startTime);
    let remainingVolume = volume;
    const unitVolume =
        volume*1000 / (endTime.getDate() - startTime.getDate())
    // 电价随时间变化
    function getUnitPrice(time: Date): number {
        const hour = time.getHours();

        if ((hour >= 10 && hour < 15) || (hour >= 18 && hour < 21)) {
            // 峰时 (10:00~15:00, 18:00~21:00)
            return 1.0;
        } else if (
            (hour >= 7 && hour < 10) ||
            (hour >= 15 && hour < 18) ||
            (hour >= 21 && hour < 23)
        ) {
            // 平时 (7:00~10:00, 15:00~18:00, 21:00~23:00)
            return 0.7;
        } else {
            // 谷时 (23:00~次日7:00)
            return 0.4;
        }
    }
    while (currentTime < endTime && remainingVolume > 0) {
        const nextHour = new Date(currentTime);
        nextHour.setHours(currentTime.getHours() + 1);
        nextHour.setMinutes(0);
        nextHour.setSeconds(0);

        const timeToNextHour =
            (nextHour.getTime() - currentTime.getTime()) / 1000;
        const unitPrice = getUnitPrice(currentTime);
        const volumeForCurrentHour = Math.min(
            timeToNextHour * unitVolume,
            remainingVolume
        );

        chargingFee += volumeForCurrentHour * unitPrice;
        remainingVolume -= volumeForCurrentHour;
        currentTime = nextHour;
    }

    return chargingFee;
}
export interface ChargingResponseData {
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
export default async function handleChargingEnd(
    userId: number
): Promise<ChargingResponseData> {
    const request = await chargingRequest
        .findOne({
            userId: userId,
            status: ChargingRequestStatus.charging,
        })
        .exec();
    if (!request) {
        // console.error(
        //     `a request in charging state not found for user ${userId}`
        // );
        throw new Error(
            `a request in charging state not found for user ${userId}`
        );
    }
    const pile = await chargingPiles
        .findOne({
            // userId: userId,
            "queue.requestId": request.requestId,
        })
        .exec();
    var responseData: ChargingResponseData;
    // 补充生成详单逻辑
    // 生成详单逻辑
    if (!pile) {
        console.error("charging pile not found");
        throw new Error("charging pile not found");
    }

    const endTime = getDate();
    const startTime = request.requestTime;
    // chargingTime, in hours
    const chargingTime =
        (endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60;
    const volume =
        chargingTime * pile.chargingPower > request.batteryAmount
            ? request.batteryAmount
            : chargingTime * pile.chargingPower;

    // TODO 单位随时间变化电价 验证正确性
    const chargingFee = calculateChargingFee(startTime, endTime, volume);

    const serviceFee = volume * 0.8;
    const totalFee = chargingFee + serviceFee;
    const orderId = "CD" + getDate().getTime().toString(); // 根据时间戳生成订单号
    responseData = {
        chargingFee: +chargingFee.toFixed(2),
        chargingPileId: pile.chargingPileId,
        chargingTime: +chargingTime.toFixed(2),
        createTime: startTime,
        endTime,
        orderId,
        serviceFee: +serviceFee.toFixed(2),
        startTime,
        time: new Date().getTime().toString(),
        totalFee: +totalFee.toFixed(2),
        userId: userId,
        volume: +volume.toFixed(2),
    };

    // create new record in chargingRecord
    await Promise.all([
        chargingRecord.create({
            userId: userId,
            recordId: orderId,
            requestId: request.requestId,
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
            { $pull: { queue: { requestId: request.requestId } } }
        ),
        // update ChargingPileStats
        ChargingPileStats.findOneAndUpdate(
            { chargingPileId: pile.chargingPileId },
            {
                $inc: {
                    totalChargingSessions: 1,
                    totalChargingDuration: chargingTime * 60 * 60, // converting to seconds
                    totalChargingVolume: volume,
                    totalChargingFee: chargingFee,
                    totalServiceFee: serviceFee,
                    totalFee: totalFee,
                },
            },
            { upsert: true } // Create a new document if not found
        ),
    ]);

    return responseData;
}
