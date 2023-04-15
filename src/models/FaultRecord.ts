import mongoose from 'mongoose'
const faultRecordSchema = new mongoose.Schema({
    recordId: String,
    chargingPileId: String,
    faultTime: Date,
    solveTime: Date,
});
faultRecordSchema.virtual("chargingPile", {
    ref: "ChargingPile",
    localField: "chargingPileId",
    foreignField: "chargingPileId",
});
export default mongoose.model('FaultRecords', faultRecordSchema)
