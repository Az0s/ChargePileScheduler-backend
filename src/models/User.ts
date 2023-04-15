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
