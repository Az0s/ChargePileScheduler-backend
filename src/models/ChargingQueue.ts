import mongoose from "mongoose";
export interface IChargingQueue extends mongoose.Document {
    userId: number;
    requestId: string;
    queueNumber: number;
    requestType: string;
    requestTime: Date;
    requestVolume: number;
}
const chargingQueueSchema = new mongoose.Schema({
    userId: {
        type: Number,
        ref: "Users",
        justOne: true,
        required: true,
    },
    requestId: {
        type: String,
        ref: "ChargingRequests",
        justOne: true,
        required: true,
    },
    queueNumber: {
        type: Number,
        required: true,
    },
    requestType: {
        type: String,
        required: true,
    },
    requestTime: {
        type: Date,
        required: true,
    },
    requestVolume: {
        type: Number,
        required: true,
    },
});

chargingQueueSchema.virtual("user", {
    ref: "Users",
    localField: "userId",
    foreignField: "userId",
    justOne: true,
});
// chargingQueueSchema.virtual("chargingPile", {
//     ref: "ChargingPile",
//     localField: "queueNumber",
//     foreignField: "queueLength",
//     justOne: true,
// });
export default mongoose.model<IChargingQueue>("ChargingQueues", chargingQueueSchema);
