import mongoose from "mongoose";
const chargingQueueSchema = new mongoose.Schema({
    userId: Number,
    requestId: String,
    queueNumber: Number,
    requestType: String,
    requestTime: Date,
    chargingAmount: Number, // used in dispatch
});

chargingQueueSchema.virtual("user", {
    ref: "Users",
    localField: "userId",
    foreignField: "userId",
    justOne: true,
});
chargingQueueSchema.virtual("chargingRequest", {
    ref: "ChargingRequests",
    localField: "requestId",
    foreignField: "requestId",
    justOne: true,
});
// chargingQueueSchema.virtual("chargingPile", {
//     ref: "ChargingPile",
//     localField: "queueNumber",
//     foreignField: "queueLength",
//     justOne: true,
// });
export default mongoose.model("ChargingQueues", chargingQueueSchema);
