import mongoose from "mongoose";
const chargingPileSchema = new mongoose.Schema({
    chargingPileId: String, // should be ABCDE
    chargingPower: Number,
    chargingType: String,
    maxQueue: Number,
    queue: [
        {
            requestId: String,
        },
    ],
    status: Boolean,
});

// chargingPileSchema.virtual("chargingRecords", {
//     ref: "ChargingRecord",
//     localField: "chargingPileId",
//     foreignField: "chargingPileId",
// });

export default mongoose.model("ChargingPiles", chargingPileSchema);
