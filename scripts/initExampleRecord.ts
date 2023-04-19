import mongoose from "mongoose";
import ChargingPile from "../src/models/ChargingPile";
import ChargingQueue from "../src/models/ChargingQueue";
import ChargingRecord from "../src/models/ChargingRecord";
import ChargingRequest from "../src/models/ChargingRequest";
import ChargingStats from "../src/models/ChargingStats";
import FaultRecord from "../src/models/FaultRecord";
import User from "../src/models/User";
import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
    const db = process.env.MONGO_URL;
    // 连接数据库
    await mongoose.connect(db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    } as mongoose.ConnectOptions);

    // 确保打开连接后，数据模型对应的集合已经创建
    await User.findOne({});

    // 插入样例数据
    await ChargingPile.create({
        chargingPileId: "pile001",
        chargingPower: 10,
        chargingType: "Fast",
        queueLength: 3,
    });

    // 以下同理处理其他模型
    await ChargingQueue.findOne({});
    await ChargingQueue.create({
        queueNumber: "F3",
        requestType: "urgent",
        requestTime: new Date(),
    });

    await ChargingRecord.findOne({});
    await ChargingRecord.create({
        recordId: "record001",
        userId: "user001",
        chargingPileId: "pile001",
        startTime: new Date(),
        endTime: new Date(),
        volume: 10,
        chargingFee: 1.2,
        serviceFee: 0.5,
        totalFee: 1.7,
    });

    await ChargingRequest.findOne({});
    await ChargingRequest.create({
        requestId: "request001",
        userId: "user001",
        requestTime: new Date(),
        requestMode: "normal",
        requestVolume: 20,
    });

    await ChargingStats.findOne({});
    await ChargingStats.create({
        statsId: "stats001",
        time: new Date(),
        chargingPileId: "pile001",
        chargingTimes: 2,
        chargingDuration: 60,
        chargingVolume: 8,
        chargingFee: 0.9,
        serviceFee: 0.3,
        totalFee: 1.2,
    });

    await FaultRecord.findOne({});
    await FaultRecord.create({
        recordId: "fault001",
        chargingPileId: "pile001",
        faultTime: new Date(),
        solveTime: new Date(),
    });

    await User.findOne({});
    await User.create({
        userId: "user001",
        username: "testuser",
        password: "123456",
        phoneNumber: "12345678901",
    });

    // 断开连接
    await mongoose.disconnect();
})();
