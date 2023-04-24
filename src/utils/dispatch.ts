/*
 * @Date: 2023-04-14 20:36:00
 * @LastEditors: Azus
 * @LastEditTime: 2023-04-24 17:33:12
 * @FilePath: /ChargePileScheduler/src/utils/dispatch.ts
 * @Description: dispatch charging queue
 * 1. get charging queue
 * 2. get charging pile
 * 3. dispatch charging queue
 */

// import users from "../models/User.js";
import chargingPiles from "../models/ChargingPile.js";
import chargingQueue from "../models/ChargingQueue.js";
// import chargingRecord from "../models/ChargingRecord.js";
// import chargingRequest from "../models/ChargingRequest.js";
// import chargingStats from "../models/ChargingStats.js";
// import faultRecord from "../models/FaultRecord.js";

type QueueItem = {
    _id?: string;
    userId: number;
    requestId: string;
    queueNumber: number;
    requestType: string;
    requestTime: Date;
    chargingAmount: number;
};
type IncrementalQueue = {
    TQueue: QueueItem[];
    FQueue: QueueItem[];
};

type QueueGroup = {
    _id: "requestType";
    docs: QueueItem[];
};
type AvailablePile = {
    chargingPileId: string;
    chargingPilePower: number;
    chargingPileType: string;
    maxQueue: number;
    queue: QueueItem[];
};
/**
 * @requirement: accomplish time = (waitTime+chargeTime) (waitTime = sum of all the chargeTime in pile.queue) chargeTime=chargingAmount/chargingPilePower)
 * @param pile
 * @param user
 * @description  calculate the accomplish time
 */
const getAccomplishTime = (pile: AvailablePile, user: QueueItem): number => {
    const waitTime = pile.queue.reduce(
        (total, item) => total + item.chargingAmount / pile.chargingPilePower,
        0
    );
    const chargeTime = user.chargingAmount / pile.chargingPilePower;
    const accomplishTime = waitTime + chargeTime;
    return accomplishTime;
};

/**
 * sort by requestType and updating queueNumber
 * @returns sorted queue
 */
const setIncrementalQueue = async (): Promise<IncrementalQueue> => {
    const queue: QueueGroup[] = await chargingQueue.aggregate([
        { $sort: { requestType: 1, queueNumber: 1 } },
        {
            $group: {
                _id: "requestType",
                docs: { $push: "$$ROOT" },
            },
        },
    ]);
    const TQueue: QueueItem[] = [];
    const FQueue: QueueItem[] = [];
    // sort incrememtal queue
    queue.forEach((result) => {
        result.docs.forEach((doc, index) => {
            const updatedDoc: QueueItem = {
                ...doc,
                queueNumber: index + 1,
            };
            if (doc.requestType === "T") {
                TQueue.push(updatedDoc);
            } else {
                FQueue.push(updatedDoc);
            }
            chargingQueue.updateOne({ _id: doc._id }, updatedDoc).exec();
        });
    });
    return { TQueue, FQueue };
};
const dispatchUser = async (
    availablePiles: AvailablePile[],
    userQueue: QueueItem[] // mutating
): Promise<number[]> => {
    const dispatchedUser: number[] = [];
    while (availablePiles.length > 0 && userQueue.length > 0) {
        const userQueueItem = userQueue[0];
        const accomplishTimeArray = availablePiles.map((pile) =>
            getAccomplishTime(pile, userQueueItem)
        );
        const minAccomplishTime = Math.min(...accomplishTimeArray);
        const minAccomplishTimeIndex = accomplishTimeArray.findIndex(
            (time) => time === minAccomplishTime
        );
        const { chargingPileId } = availablePiles[minAccomplishTimeIndex];
        // must await to ensure queue is sorted
        const p = chargingPiles
            .updateOne(
                { chargingPileId },
                { $push: { queue: { requestId: userQueueItem.requestId } } }
            )
            .exec();
        dispatchedUser.push(userQueueItem.userId);
        availablePiles[minAccomplishTimeIndex].queue.push(userQueueItem);
        if (
            availablePiles[minAccomplishTimeIndex].queue.length >=
            availablePiles[minAccomplishTimeIndex].maxQueue
        ) {
            availablePiles.splice(minAccomplishTimeIndex, 1);
        }
        userQueue.shift();
        await p;
    }
    return dispatchedUser;
};

const getAvailablePiles = async (type: String): Promise<AvailablePile[]> => {
    var availablePiles: AvailablePile[] = [];
    const piles = await chargingPiles.find({
        chargingType: type,
    });
    for (let pile of piles) {
        if (pile.queue.length < pile.maxQueue && pile.status) {
            const availableFastPile = {
                chargingPileId: pile.chargingPileId,
                chargingPilePower: pile.chargingPower,
                chargingPileType: pile.chargingType,
                maxQueue: pile.maxQueue,
                queue: await Promise.all(
                    pile.queue.map(async (requestId): Promise<QueueItem> => {
                        return await chargingQueue.findOne({
                            requestId,
                        });
                    })
                ),
            };
            availablePiles.push(availableFastPile);
        }
    }
    availablePiles.sort((a, b) => a.queue.length - b.queue.length);
    return availablePiles;
};
/*  
    当任意充电桩队列存在空位时，系统开始叫号，按照排队顺序号“先来 先到”的方式，
    选取等候区与该充电桩模式匹配的一辆车进入充电区
    (即快充桩对应 F 类 型号码，慢充桩对应 T 类型号码)，并按照调度策略加入到匹配充电桩的排队队列中。
3、 系统调度策略为:对应匹配充电模式下(快充/慢充)
    被调度车辆完成充电所需时长最短。minimum getAccomplishTime(pile, user)*/
/**
 * @description: dispatch charging queue to charging piles
 */
export default async function dispatch() {
    try {
        const userInQueue: IncrementalQueue = await setIncrementalQueue();
        const [availableFastPiles, availableSlowPiles] = await Promise.all([
            getAvailablePiles("F"),
            getAvailablePiles("T"),
        ]);
        const dispatchedUser = (
            await Promise.all([
                dispatchUser(availableFastPiles, userInQueue.FQueue),
                dispatchUser(availableSlowPiles, userInQueue.TQueue),
            ])
        ).flat();
        await chargingQueue.deleteMany({ userId: { $in: dispatchedUser } });
        await setIncrementalQueue();
        return;
    } catch (error) {
        console.error(error);
        throw new Error("dispatch error");
    }
}

/**
 * print current queue to console. dev only
 * @returns
 */
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
    return;
};
