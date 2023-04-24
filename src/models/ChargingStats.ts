import mongoose from 'mongoose'
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
    statsId: Number,
    time: Date,
    chargingPileId: String,
    chargingTimes: Number,
    chargingDuration: Number,
    chargingVolume: Number,
    chargingFee: Number,
    serviceFee: Number,
    totalFee: Number,
});

chargingStatsSchema.virtual("chargingPile", {
    ref: "ChargingPile",
    localField: "chargingPileId",
    foreignField: "chargingPileId",
    justOne: true,
});
export default mongoose.model('ChargingStats', chargingStatsSchema)
