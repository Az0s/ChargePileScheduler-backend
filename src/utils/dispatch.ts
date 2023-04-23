/*
 * @Date: 2023-04-14 20:36:00
 * @LastEditors: Azus
 * @LastEditTime: 2023-04-23 17:33:48
 * @FilePath: /ChargePileScheduler/src/utils/dispatch.ts
 * @Description: dispatch charging queue
 * 1. get charging queue
 * 2. get charging pile
 * 3. dispatch charging queue
 */

// import users from "../models/User.js";
// import chargingPiles from "../models/ChargingPile.js";
import chargingQueue from "../models/ChargingQueue.js";
// import chargingRecord from "../models/ChargingRecord.js";
// import chargingRequest from "../models/ChargingRequest.js";
// import chargingStats from "../models/ChargingStats.js";
// import faultRecord from "../models/FaultRecord.js";

export default async function dispatch() {
    // print current queue
    await printQueue();
    sortQueue();
    await printQueue();
    setTimeout(() => {
        console.log("dispatch");
    }, 500);
    return;
}


const printQueue = async () => {
    console.log("current queue:");
    chargingQueue
        .find()
        .sort({ requestType: 1, queueNumber: 1 })
        .exec()
        .then((queue) => {
            queue.forEach((doc) => {
                console.log(doc);
            });
        });
};
/**
 * sorting by requestType and updating queueNumber
 */
const sortQueue = async () => {
    chargingQueue
        .aggregate([
            { $sort: { requestType: 1, queueNumber: 1 } },
            {
                $group: {
                    _id: "$requestType",
                    docs: { $push: "$$ROOT" },
                },
            },
        ])
        .then((queue) => {
            queue.forEach((result) => {
                result.docs.forEach((doc, index) => {
                    chargingQueue
                        .updateOne(
                            { _id: doc._id },
                            { $set: { queueNumber: index + 1 } }
                        )
                        .exec();
                });
            });
        });
};
