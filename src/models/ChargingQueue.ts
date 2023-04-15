import mongoose from 'mongoose'
const chargingQueueSchema = new mongoose.Schema({
    queueNumber: Number,
    requestType: String,
    requestTime: Date,
});
chargingQueueSchema.virtual("chargingPile", {
    ref: "ChargingPile",
    localField: "queueNumber",
    foreignField: "queueLength",
    justOne: true,
});
export default mongoose.model('ChargingQueues', chargingQueueSchema)