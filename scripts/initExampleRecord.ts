import mongoose from "mongoose";
import ChargingPile from "../src/models/ChargingPile";
import ChargingQueue from "../src/models/ChargingQueue";
import ChargingRecord from "../src/models/ChargingRecord";
import ChargingRequest, {
    ChargingRequestStatus,
} from "../src/models/ChargingRequest";
import ChargingStats from "../src/models/ChargingStats";
import FaultRecord from "../src/models/FaultRecord";
import User from "../src/models/User";
import * as dotenv from "dotenv";
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
    await Promise.all([
        ChargingPile.create({
            chargingPileId: "A",
            chargingPower: 30,
            chargingType: "F",
            status: true,
            maxQueue: 2,
        }),
        ChargingPile.create({
            chargingPileId: "B",
            chargingPower: 30,
            chargingType: "F",
            status: true,
            maxQueue: 2,
        }),
        ChargingPile.create({
            chargingPileId: "C",
            chargingPower: 7,
            chargingType: "T",
            status: true,
            maxQueue: 2,
        }),
        ChargingPile.create({
            chargingPileId: "D",
            chargingPower: 7,
            chargingType: "T",
            status: true,
            maxQueue: 2,
        }),
        ChargingPile.create({
            chargingPileId: "E",
            chargingPower: 7,
            chargingType: "T",
            status: true,
            maxQueue: 2,
        }),
    ]);

    // 以下同理处理其他模型
    await ChargingQueue.findOne({});
    await Promise.all([
        ChargingQueue.create({
            userId: "1",
            queueNumber: "1",
            requestId: "a14bc086-888f-49ed-9e15-a86165980951",
            requestType: "F",
            requestVolume: 100,
            requestTime: new Date(),
        }),
        ChargingQueue.create({
            userId: "2",
            requestId: "9ad2e227-001b-47e9-a783-c2d7740bc905",
            queueNumber: "2",
            requestType: "F",
            requestVolume: 80,

            requestTime: new Date(),
        }),
        ChargingQueue.create({
            userId: "3",
            queueNumber: "3",
            requestId: "1fb2e11b-2e1b-4178-9ef9-d7ab28d9c4de",
            requestType: "F",
            requestVolume: 90,
            requestTime: new Date(),
        }),
    ]);

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
        requestId: "a14bc086-888f-49ed-9e15-a86165980951",
        userId: "1",
        requestTime: new Date(),
        requestMode: "F",
        requestVolume: 90,
        batteryAmount: 100.0,
        status: ChargingRequestStatus.pending,
    });
    await ChargingRequest.create({
        requestId: "9ad2e227-001b-47e9-a783-c2d7740bc905",
        userId: "2",
        requestTime: new Date(),
        requestMode: "F",
        requestVolume: 90,
        batteryAmount: 100.0,
        status: ChargingRequestStatus.pending,
    });
    await ChargingRequest.create({
        requestId: "1fb2e11b-2e1b-4178-9ef9-d7ab28d9c4de",
        userId: "3",
        requestTime: new Date(),
        requestMode: "F",
        requestVolume: 90,
        batteryAmount: 100.0,
        status: ChargingRequestStatus.pending,
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
    await User.findOne({});
    await User.create({
        userId: "0",
        username: "test",
        password: "test",
        phoneNumber: "12345678901",
        isAdmin: true,
    });
    await User.create({
        userId: "0",
        username: "test1",
        password: "test1",
        phoneNumber: "12345678901",
        isAdmin: true,
    });
    await User.create({
        userId: "0",
        username: "test2",
        password: "test2",
        phoneNumber: "12345678901",
        isAdmin: true,
    });

    // 断开连接
    await mongoose.disconnect();
})();
