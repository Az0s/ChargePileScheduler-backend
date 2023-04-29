import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid';
export interface IChargingRecord extends mongoose.Document {
    recordId: string;
    userId: number;
    chargingPileId: string;
    startTime: Date;
    endTime: Date;
    volume: number;
    chargingFee: number;
    serviceFee: number;
    totalFee: number;
}
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
    recordId: { type: String, required: true },
    userId: { type: Number, required: true },
    chargingPileId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    volume: { type: Number, required: true },
    chargingFee: { type: Number, required: true },
    serviceFee: { type: Number, required: true },
    totalFee: { type: Number, required: true },
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
export default mongoose.model<IChargingRecord>(
    "ChargingRecords",
    chargingRecordSchema
);