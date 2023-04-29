import chargingPiles from "../src/models/ChargingPile";
import mongoose, { mongo } from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();
mongoose.connect(process.env.MONGO_URL, {}).then(() => {
    chargingPiles.distinct("queue.requestId").then((r) => {
        console.log(r);
        mongoose.connection.close();
    });
    // close connection
});
