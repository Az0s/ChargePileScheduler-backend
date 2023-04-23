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
        chargingPileId: "1",
        chargingPower: 10,
        chargingType: "Fast",
        queueLength: 3,
    });

    // 以下同理处理其他模型
    await ChargingQueue.findOne({});
    await ChargingQueue.create({
        userId: "1",
        queueNumber: "1",
        requestType: "F",
        requestTime: new Date(),
    });
    await ChargingQueue.create({
        userId: "2",
        queueNumber: "2",
        requestType: "F",
        requestTime: new Date(),
    });
    await ChargingQueue.create({
        userId: "3",
        queueNumber: "3",
        requestType: "F",
        requestTime: new Date(),
    });

    await ChargingRecord.findOne({});
    await ChargingRecord.create({
        recordId: "1",
        userId: "1",
        chargingPileId: "1",
        startTime: new Date(),
        endTime: new Date(),
        volume: 10,
        chargingFee: 1.2,
        serviceFee: 0.5,
        totalFee: 1.7,
    });

    await ChargingRequest.findOne({});
    await ChargingRequest.create({
        requestId: "1",
        userId: "1",
        requestTime: new Date(),
        requestMode: "F",
        requestVolume: 20,
    });

    await ChargingStats.findOne({});
    await ChargingStats.create({
        statsId: "1",
        time: new Date(),
        chargingPileId: "1",
        chargingTimes: 2,
        chargingDuration: 60,
        chargingVolume: 8,
        chargingFee: 0.9,
        serviceFee: 0.3,
        totalFee: 1.2,
    });

    await FaultRecord.findOne({});
    await FaultRecord.create({
        recordId: "1",
        chargingPileId: "1",
        faultTime: new Date(),
        solveTime: new Date(),
    });
    // mongoose 里面 new... save...的写法跟create有什么区别
    await User.findOne({});
    await User.create({
        userId: "0",
        username: "test",
        password: "test",
        phoneNumber: "12345678901",
        isAdmin: true
    });
    await User.create({
        userId: "0",
        username: "test1",
        password: "test1",
        phoneNumber: "12345678901",
        isAdmin: true
    });
    await User.create({
        userId: "0",
        username: "test2",
        password: "test2",
        phoneNumber: "12345678901",
        isAdmin: true
    });

    // 断开连接
    await mongoose.disconnect();
})();
