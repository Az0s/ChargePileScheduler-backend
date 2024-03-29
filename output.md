## ======= ChargingPile.ts =======

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

 ## ======= ChargingQueue.ts =======

import mongoose from 'mongoose'
const chargingQueueSchema = new mongoose.Schema({
    queueNumber: Number,
    requestType: String,
    requestTime: Date,
});
chargingQueueSchema.virtual("chargingPile", {
    ref: "ChargingPile",
    localField: "queueNumber",
    foreignField: "queueLength",
    justOne: true,
});
export default mongoose.model('ChargingQueues', chargingQueueSchema)

 ## ======= ChargingRecord.ts =======

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

 ## ======= ChargingRequest.ts =======

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


 ## ======= ChargingStats.ts =======

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


 ## ======= FaultRecord.ts =======

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


 ## ======= User.ts =======

// const mongoose = require("mongoose");
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
    },
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: String,
});

userSchema.virtual("requests", {
    ref: "ChargingRequest",
    localField: "userId",
    foreignField: "userId",
});


export default mongoose.model("Users", userSchema);

