import mongoose from 'mongoose'
const chargingRecordSchema = new mongoose.Schema({
recordId: String,
userId: String,
chargingPileId: String,
startTime: Date,
endTime: Date,
volume: Number,
chargingFee: Number,
serviceFee: Number,
totalFee: Number
});
chargingRecordSchema.virtual("user", {
    ref: "User",
    localField: "userId",
    foreignField: "userId",
    justOne: true,
});
export default mongoose.model('ChargingRecords', chargingRecordSchema)