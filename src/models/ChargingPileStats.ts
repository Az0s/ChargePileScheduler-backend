import mongoose from "mongoose";

export interface IChargingPileStats extends mongoose.Document {
    chargingPileId: string;
    totalChargingSessions: number;
    totalChargingDuration: number;
    totalChargingVolume: number;
    totalChargingFee: number;
    totalServiceFee: number;
    totalFee: number;
}
const chargingPileStatsSchema = new mongoose.Schema({
    chargingPileId: {
        type: String,
        ref: "ChargingPile",
        required: true,
        unique: true,
    },
    totalChargingSessions: {
        type: Number,
        default: 0,
    },
    totalChargingDuration: {
        type: Number,
        default: 0,
    },
    totalChargingVolume: {
        type: Number,
        default: 0,
    },
    totalChargingFee: {
        type: Number,
        default: 0,
    },
    totalServiceFee: {
        type: Number,
        default: 0,
    },
    totalFee: {
        type: Number,
        default: 0,
    },
});

export default mongoose.model("ChargingPileStats", chargingPileStatsSchema);

