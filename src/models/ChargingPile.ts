import mongoose from 'mongoose'
const chargingPileSchema = new mongoose.Schema({
chargingPileId: String,
chargingPower: Number,
chargingType: String,
queueLength: Number
});

chargingPileSchema.virtual("chargingRecords", {
    ref: "ChargingRecord",
    localField: "chargingPileId",
    foreignField: "chargingPileId",
});


export default mongoose.model('ChargingPiles', chargingPileSchema)