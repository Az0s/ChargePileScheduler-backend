import mongoose from 'mongoose'
export interface IChargingStats extends mongoose.Document {
    statsId: number;
    time: Date;
    chargingPileId: string;
    chargingTimes: number;
    chargingDuration: number;
    chargingVolume: number;
    chargingFee: number;
    serviceFee: number;
    totalFee: number;
}
/**
 * 存储充电站的统计数据
 * 包括统计ID
 * 时间（日、周、月）
 * 充电桩ID
 * 累计充电次数
 * 累计充电时长
* 累计充电量 
 * 累计充电费用
 * 累计服务费用
 * 累计总费用等；
 */
const chargingStatsSchema = new mongoose.Schema({
    statsId: { type: Number, required: true },
    time: { type: Date, required: true },
    chargingPileId: { type: String, required: true },
    chargingTimes: { type: Number, required: true },
    chargingDuration: { type: Number, required: true },
    chargingVolume: { type: Number, required: true },
    chargingFee: { type: Number, required: true },
    serviceFee: { type: Number, required: true },
    totalFee: { type: Number, required: true },
});

chargingStatsSchema.virtual("chargingPile", {
    ref: "ChargingPile",
    localField: "chargingPileId",
    foreignField: "chargingPileId",
    justOne: true,
});
export default mongoose.model<IChargingStats>(
    "ChargingStats",
    chargingStatsSchema
);
