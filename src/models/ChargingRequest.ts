import mongoose from 'mongoose'
const chargingRequestSchema = new mongoose.Schema({
    requestId: String,
    userId: String,
    requestTime: Date,
    requestMode: String,
    requestVolume: Number,
});

chargingRequestSchema.virtual("queue", {
    ref: "ChargingQueue",
    localField: "requestId",
    foreignField: "queueNumber",
    justOne: true,
});


export default mongoose.model('ChargingRequests', chargingRequestSchema)
