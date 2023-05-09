import mongoose from "mongoose";
export interface IChargingPile extends mongoose.Document {
    chargingPileId: string;
    chargingPower: number;
    chargingType: string;
    maxQueue: number;
    queue: {
        requestId: string;
    }[];
    status: ChargingPileStatus;
}

export enum ChargingPileStatus {
    running = "RUNNING",
    shutdown = "SHUTDOWN",
    unavailable = "UNAVAILABLE",
}

const chargingPileSchema = new mongoose.Schema({
    chargingPileId: {
        type: String,
        required: true,
    }, // should be ABCDE
    chargingPower: {
        type: Number,
        required: true,
    },
    chargingType: {
        type: String,
        required: true,
    },
    maxQueue: {
        type: Number,
        required: true,
    },
    queue: [
        {
            requestId: {
                type: String,
                ref: "ChargingRequest",
            },
        },
    ],
    status: {
        type: String,
        enum: Object.values(ChargingPileStatus),
        required: true,
    },
});

export default mongoose.model<IChargingPile>(
    "ChargingPiles",
    chargingPileSchema
);
