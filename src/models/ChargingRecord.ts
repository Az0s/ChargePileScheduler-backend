import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid';

/**
 * ChargingRecord表
 * 存储充电记录信息
 * 
 * 充电记录ID
 * 用户ID
 * 充电桩ID
 * 充电开始时间
 * 充电结束时间
 * 充电电量
 * 充电费用
 * 服务费用
 * 总费用
 */
const chargingRecordSchema = new mongoose.Schema({
recordId: String,
userId: Number,
chargingPileId: String,
startTime: Date,
endTime: Date,
volume: Number,
chargingFee: Number,
serviceFee: Number,
totalFee: Number
});
chargingRecordSchema.pre("save", function (next) {
    if (!this.recordId) {
        this.recordId = uuidv4();
    }
    next();
});

chargingRecordSchema.virtual("user", {
    ref: "User",
    localField: "userId",
    foreignField: "userId",
    justOne: true,
});
export default mongoose.model('ChargingRecords', chargingRecordSchema)