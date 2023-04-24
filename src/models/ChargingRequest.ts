import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const chargingRequestSchema = new mongoose.Schema({
    requestId: { type: String, unique: true },
    userId: Number,
    requestTime: Date,
    requestMode: String,
    requestVolume: Number,
    batteryAmount: Number,
});

chargingRequestSchema.pre("save", function (next) {
    if (!this.requestId) {
        this.requestId = uuidv4();
    }
    next();
});

//! use uuidv4 instead to enable manual generate requestId on the fly
// // auto generate requestId
// chargingRequestSchema.pre("save", async function (next) {
//     const doc = this;
//     const chargingRequest = mongoose.model(
//         "ChargingRequests",
//         chargingRequestSchema
//     );
//     // const count = await chargingRequest.countDocuments();
//     chargingRequest
//         .find()
//         .sort({ requestId: -1 })
//         .limit(1)
//         .exec()
//         .then((res) => {
//             doc.requestId = res.length > 0 ? res[0].requestId + 1 : 1;
//             next();
//         })
//         .catch((err) => next(err));
// });

// chargingRequestSchema.virtual("queue", {
//     ref: "ChargingQueue",
//     localField: "requestId",
//     foreignField: "queueNumber",
//     justOne: true,
// });

export default mongoose.model("ChargingRequests", chargingRequestSchema);
