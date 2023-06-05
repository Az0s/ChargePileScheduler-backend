import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export enum ChargingRequestStatus {
    pending = "pending",    // waiting zone. i.e: T1, F2.. 
    dispatched = "dispatched",  // dispatched to certain chargingPile, but not charging yet
    suspend = "suspend",    // will be applied to all pending requests when the charging pile is suspended. 
    charging = "charging",
    finished = "finished",
    canceled = "canceled",
}

export interface IChargingRequest extends mongoose.Document {
    requestId: string;
    userId: number;
    requestTime: Date;
    requestMode: string;
    requestVolume: number;
    batteryAmount: number;
    status: ChargingRequestStatus; // 使用枚举作为 type 类型
    startTime: Date;
    recordId: string;
}

const chargingRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        unique: true,
        required: true,
    },
    userId: {
        type: Number,
        required: true,
    },
    requestTime: {
        type: Date,
        required: true,
    },
    requestMode: {
        type: String,
        required: true,
    },
    requestVolume: {
        type: Number,
        required: true,
    },
    batteryAmount: {
        type: Number,
        required: true,
    },
    startTime: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        enum: Object.values(ChargingRequestStatus),
        required: true,
    },
    recordId: {
        type: String,
        required: false,
    },
});

chargingRequestSchema.pre("save", function (next) {
    if (!this.requestId) {
        this.requestId = uuidv4();
    }
    next();
});

export default mongoose.model<IChargingRequest>(
    "ChargingRequests",
    chargingRequestSchema
);
