import mongoose from 'mongoose'
const chargingPileSchema = new mongoose.Schema({
chargingPileId: Number,
chargingPower: Number,
chargingType: String,
queueLength: Number
});

// auto increment chargingPileId
chargingPileSchema.pre("save", function (next) {
    const doc = this;
    // Find the highest chargingPileId in the collection
    // and increment it by 1 for the new chargingPile
    const ChargingPile = mongoose.model("ChargingPile", chargingPileSchema);
    ChargingPile.find()
        .sort({ chargingPileId: -1 })
        .limit(1)
        .exec()
        .then((result) => {
            doc.chargingPileId = result.length > 0 ? result[0].chargingPileId + 1 : 1;
            next(); // Call the next middleware
        })
        .catch((err) => next(err));
});

// chargingPileSchema.virtual("chargingRecords", {
//     ref: "ChargingRecord",
//     localField: "chargingPileId",
//     foreignField: "chargingPileId",
// });


export default mongoose.model('ChargingPiles', chargingPileSchema)