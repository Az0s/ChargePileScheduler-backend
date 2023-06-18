import mongoose from "mongoose";
import ChargingRecord, { IChargingRecord } from "../src/models/ChargingRecord";
import * as dotenv from "dotenv";
import { createObjectCsvWriter } from "csv-writer";

// export interface IChargingRecord extends mongoose.Document {
//     recordId: string;
//     userId: number;
//     chargingPileId: string;
//     requestId: string;
//     startTime: Date;
//     endTime: Date;
//     volume: number;
//     chargingFee: number;
//     serviceFee: number;
//     totalFee: number;
// }

dotenv.config();
(async () => {
    const db = process.env.MONGO_URL;
    // 连接数据库
    await mongoose.connect(db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    console.log("connected");
    console.log("got record");
    const records = await ChargingRecord.find({});

    const csvWriter = createObjectCsvWriter({
        path: "charging_records.csv",
        header: [
            { id: "id", title: "ID" },
            { id: "recordId", title: "Record ID" },
            { id: "userId", title: "User ID" },
            { id: "chargingPileId", title: "Charging Pile ID" },
            { id: "requestId", title: "Request ID" },
            { id: "startTime", title: "Start Time" },
            { id: "endTime", title: "End Time" },
            { id: "volume", title: "Volume" },
            { id: "chargingFee", title: "Charging Fee" },
            { id: "serviceFee", title: "Service Fee" },
            { id: "totalFee", title: "Total Fee" },
        ],
    });
    await csvWriter.writeRecords(records.map((record) => record.toObject()));
    console.log("complete");
})();
