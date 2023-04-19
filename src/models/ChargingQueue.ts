import mongoose from "mongoose";
const chargingQueueSchema = new mongoose.Schema({
    userId: Number,
    queueNumber: String,
    requestType: String,
    requestTime: Date,
    chargingAmount: Number,
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
export default mongoose.model("ChargingQueues", chargingQueueSchema);
