/*
 * @Date: 2023-04-14 20:36:00
 * @LastEditors: Azus
 * @LastEditTime: 2023-05-09 20:45:25
 * @FilePath: /ChargePileScheduler/src/utils/dispatch.ts
 * @Description: dispatch charging queue
 * 1. get charging queue
 * 2. get charging pile
 * 3. dispatch charging queue
 */

// import users from "../models/User.js";
import ChargingPileModel, {
    IChargingPile,
    ChargingPileStatus,
} from "../models/ChargingPile.js";
import ChargingQueueModel from "../models/ChargingQueue.js";
import ChargingRecordModel from "../models/ChargingRecord.js";
import ChargingRequestModel, {
    ChargingRequestStatus,
    IChargingRequest,
} from "../models/ChargingRequest.js";
import { getDate, getTimestamp } from "./timeService.js";

type QueueItem = {
    _id?: any;
    userId: number;
    requestId: string;
    queueNumber: number;
    requestType: string;
    requestTime: Date;
    requestVolume: number;
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
    queue: IChargingRequest[];
};
/**
 * @requirement: accomplish time = (waitTime+chargeTime) (waitTime = sum of all the chargeTime in pile.queue) chargeTime=chargingAmount/chargingPilePower)
 * @param pile
 * @param user
 * @description  calculate the accomplish time
 */
const getAccomplishTime = (pile: AvailablePile, user: QueueItem): number => {
    const waitTime = pile.queue.reduce(
        (total, item) => total + item.requestVolume / pile.chargingPilePower,
        0
    );
    const chargeTime = user.requestVolume / pile.chargingPilePower;
    const accomplishTime = waitTime + chargeTime;
    return accomplishTime;
};

/**
 * sort the chargingQueue by requestType and updating queueNumber
 * @returns sorted queue
 */
const sortChargingQueue = async (): Promise<IncrementalQueue> => {
    const queue: QueueGroup[] = await ChargingQueueModel.aggregate([
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
            ChargingQueueModel.updateOne({ _id: doc._id }, updatedDoc).exec();
        });
    });
    return { TQueue, FQueue };
};
const dispatchAwaitingUser = async (
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
        // await to ensure queue is in order
        const [, , userRequest] = await Promise.all([
            ChargingPileModel.updateOne(
                { chargingPileId },
                { $push: { queue: { requestId: userQueueItem.requestId } } }
            ).exec(),
            ChargingRequestModel.updateOne(
                { requestId: userQueueItem.requestId },
                { $set: { status: ChargingRequestStatus.dispatched } }
            ).exec(),
            ChargingRequestModel.findOne({
                requestId: userQueueItem.requestId,
            }).exec(),
        ]);
        availablePiles[minAccomplishTimeIndex].queue.push(userRequest);
        dispatchedUser.push(userQueueItem.userId);
        // availablePiles[minAccomplishTimeIndex].queue.push(prequest);
        if (
            availablePiles[minAccomplishTimeIndex].queue.length >=
            availablePiles[minAccomplishTimeIndex].maxQueue
        ) {
            availablePiles.splice(minAccomplishTimeIndex, 1);
        }
        userQueue.shift();
    }
    return dispatchedUser;
};

async function activateReadyCharger(): Promise<void> {
    try {
        // 查找所有充电桩
        const chargingPiles: IChargingPile[] = await ChargingPileModel.find();

        for (const chargingPile of chargingPiles) {
            // 检查充电桩队列中是否有等待充电的用户
            if (chargingPile.queue.length > 0) {
                const firstRequestIdInQueue = chargingPile.queue[0].requestId;

                // 查找与该请求ID关联的充电请求
                const chargingRequests: IChargingRequest | null =
                    await ChargingRequestModel.findOne({
                        requestId: firstRequestIdInQueue,
                    });

                if (
                    chargingRequests &&
                    chargingRequests.status === ChargingRequestStatus.dispatched
                ) {
                    // 更新充电请求的状态和开始时间
                    chargingRequests.status = ChargingRequestStatus.charging;
                    chargingRequests.startTime = getDate();

                    await chargingRequests.save();
                    console.log(
                        `Charging request ${chargingRequests.requestId} is now charging.`
                    );
                } else if (chargingRequests) {
                    console.error(
                        `database record not found when tring to find charging request ${firstRequestIdInQueue} queried from the head of ChargingPile queue`
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error processing charging request:", error);
    }
}
const getAvailablePiles = async (type: String): Promise<AvailablePile[]> => {
    var availablePiles: AvailablePile[] = [];
    try {
        const piles = await ChargingPileModel.find({
            chargingType: type,
            status: ChargingPileStatus.running,
        });
        for (let pile of piles) {
            if (pile.queue.length < pile.maxQueue && pile.status) {
                const availableFastPile = {
                    chargingPileId: pile.chargingPileId,
                    chargingPilePower: pile.chargingPower,
                    chargingPileType: pile.chargingType,
                    maxQueue: pile.maxQueue,
                    queue: await Promise.all(
                        pile.queue.map(
                            async (requestId): Promise<IChargingRequest> => {
                                try {
                                    const request =
                                        await ChargingRequestModel.findOne({
                                            requestId: requestId.requestId,
                                        }).exec();
                                    if (!request) {
                                        throw new Error(
                                            `request not found for the specific requestId: ${requestId}`
                                        );
                                    }
                                    return request;
                                } catch (err) {
                                    console.error(err);
                                    throw err;
                                }
                            }
                        )
                    ),
                };
                availablePiles.push(availableFastPile);
            }
        }
        availablePiles.sort((a, b) => a.queue.length - b.queue.length);
        return availablePiles;
    } catch {
        console.error("getAvailablePiles error");
        throw new Error("getAvailablePiles error");
    }
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
        const userInQueue: IncrementalQueue = await sortChargingQueue();
        const [availableFastPiles, availableSlowPiles] = await Promise.all([
            getAvailablePiles("F"),
            getAvailablePiles("T"),
        ]);
        const dispatchedUser = (
            await Promise.all([
                dispatchAwaitingUser(availableFastPiles, userInQueue.FQueue),
                dispatchAwaitingUser(availableSlowPiles, userInQueue.TQueue),
            ])
        ).flat();
        await ChargingQueueModel.deleteMany({
            userId: { $in: dispatchedUser },
        });
        await Promise.all([sortChargingQueue(), activateReadyCharger()]);
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
    ChargingQueueModel.find()
        .sort({ requestType: 1, queueNumber: 1 })
        .exec()
        .then((queue) => {
            queue.forEach((doc) => {
                console.log(doc);
            });
        });
    return;
};
