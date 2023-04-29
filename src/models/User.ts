// const mongoose = require("mongoose");
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
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
    isAdmin: {
        type: Boolean,
        default: false,
    },
});
export interface IUser extends mongoose.Document {
    userId?: number; // userId 是可选的
    username: string;
    password: string;
    phoneNumber?: string; // phoneNumber 是可选的
    isAdmin: boolean;
}


userSchema.pre("save", function (next) {
    const doc = this;
    // Find the highest userId in the collection
    // and increment it by 1 for the new user
    const User = mongoose.model("User", userSchema);
    User.find()
        .sort({ userId: -1 })
        .limit(1)
        .exec()
        .then((result) => {
            doc.userId = result.length > 0 ? result[0].userId + 1 : 1;
            next(); // Call the next middleware
        })
        .catch((err) => next(err));
});

userSchema.virtual("requests", {
    ref: "ChargingRequest",
    localField: "userId",
    foreignField: "userId",
});


export default mongoose.model<IUser>("Users", userSchema);
