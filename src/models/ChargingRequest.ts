import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export enum ChargingRequestStatus {
    pending = "pending",
    dispatched = "dispatched",
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
}



const chargingRequestSchema = new mongoose.Schema({
    requestId: {
        type: String, unique: true, required: true
    },
    userId: {
        type: Number, required: true
    },
    requestTime: {
        type: Date, required: true
    },
    requestMode: {
        type: String, required: true
    },
    requestVolume: {
        type: Number, required: true
    },
    batteryAmount: {
        type: Number, required: true
    },
    status: {
        type: String,
        enum: Object.values(ChargingRequestStatus),
        required: true,
    },
});

chargingRequestSchema.pre("save", function (next) {
    if (!this.requestId) {
        this.requestId = uuidv4();
    }
    next();
});

//! use uuidv4 instead to enable manual generate requestId on the fly
// // auto generate requestId
// chargingRequestSchema.pre("save", async function (next) {
//     const doc = this;
//     const chargingRequest = mongoose.model(
//         "ChargingRequests",
//         chargingRequestSchema
//     );
//     // const count = await chargingRequest.countDocuments();
//     chargingRequest
//         .find()
//         .sort({ requestId: -1 })
//         .limit(1)
//         .exec()
//         .then((res) => {
//             doc.requestId = res.length > 0 ? res[0].requestId + 1 : 1;
//             next();
//         })
//         .catch((err) => next(err));
// });

// chargingRequestSchema.virtual("queue", {
//     ref: "ChargingQueue",
//     localField: "requestId",
//     foreignField: "queueNumber",
//     justOne: true,
// });

export default mongoose.model<IChargingRequest>(
    "ChargingRequests",
    chargingRequestSchema
);
