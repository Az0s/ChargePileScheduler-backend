import mongoose from 'mongoose'
const chargingStatsSchema = new mongoose.Schema({
    statsId: String,
    time: Date,
    chargingPileId: String,
    chargingTimes: Number,
    chargingDuration: Number,
    chargingVolume: Number,
    chargingFee: Number,
    serviceFee: Number,
    totalFee: Number,
});

chargingStatsSchema.virtual("chargingPile", {
    ref: "ChargingPile",
    localField: "chargingPileId",
    foreignField: "chargingPileId",
    justOne: true,
});
export default mongoose.model('ChargingStats', chargingStatsSchema)
