/*
 * @Date: 2023-04-14 20:36:00
 * @LastEditors: Azus
 * @LastEditTime: 2023-05-30 23:38:47
 * @FilePath: /ChargePileScheduler/src/utils/dispatch.ts
 * @Description: dispatch charging queue
 * 1. get charging queue
 * 2. get charging pile
 * 3. dispatch charging queue
 */

/* 扩展调度：
批量调度总充电时长最短：为了提高效率，假设只有当到达充电站的车辆等于充电区全部车位数量时，才开始进行一次批量调度充电，完成之后再进行下一批。规定进入充电区的一批车不再按照编号顺序依次调度，而是“统一调度”，系统调度策略为：(1)忽略每辆车的请求充电模式，所有车辆均可分配任意类型充电桩；(2)满足一批车辆完成充电总时长(所有车累计等待时间+累计充电时间)最短。例：如图1 所示，充电区总共有10 个车位，当到达充电站的车辆不少于10 辆时才能进行一次批量调度，此时按照编号顺序一次性叫号10 辆车同时进入充电区。进入充电区后，10 辆车不再按照编号顺序依次调度，而是统一进行分配。对于每辆车不考虑其充电模式，可分配任意类型充电桩，如何将10 辆车分配到对应的车位由调度策略决定，即满足10 辆车完成充电总时长(所有车累计等待时间+累计充电时间)最短
*/

// import users from "../models/User.js";
import ChargingPileModel, {
    IChargingPile,
    ChargingPileStatus,
} from "../models/ChargingPile.js";
import ChargingQueueModel, { IChargingQueue } from "../models/ChargingQueue.js";
import ChargingRecordModel from "../models/ChargingRecord.js";
import ChargingRequestModel, {
    ChargingRequestStatus,
    IChargingRequest,
} from "../models/ChargingRequest.js";
import { dispatchBatch } from "./batchDispatch.js";
import { defaultDispatch, dispatchAwaitingUser } from "./defaultDispatch.js";
import { getDate, getTimestamp } from "./timeService.js";

var dispatchFlag: boolean = true; // active dispatch when true

// type IChargingQueue = {
//     _id?: any;
//     userId: number;
//     requestId: string;
//     queueNumber: number;
//     requestType: string;
//     requestTime: Date;
//     requestVolume: number;
// };

export type IncrementalQueue = {
    TQueue: IChargingQueue[];
    FQueue: IChargingQueue[];
};

export type QueueGroup = {
    _id: "requestType";
    docs: IChargingQueue[];
};
export type AvailablePile = {
    chargingPileId: string;
    chargingPilePower: number;
    chargingPileType: string;
    maxQueue: number;
    queue: IChargingRequest[];
};
/**
 *
 * @returns  active dispatch when true
 */
export const toggleDispatchFlag = (status: boolean) => {
    dispatchFlag = status;
};
/**
 *
 * @returns  active dispatch when true
 */
export const getDispatchFlag = () => {
    return dispatchFlag;
};
/**
 * @requirement: accomplish time = (waitTime+chargeTime) (waitTime = sum of all the chargeTime in pile.queue) chargeTime=chargingAmount/chargingPilePower)
 * @param pile
 * @param user
 * @description  calculate the accomplish time
 */
export const getAccomplishTime = (
    pile: AvailablePile,
    user: IChargingQueue
): number => {
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
export const sortChargingQueue = async (): Promise<IncrementalQueue> => {
    const queue: QueueGroup[] = await ChargingQueueModel.aggregate([
        { $sort: { requestType: 1, queueNumber: 1 } },
        {
            $group: {
                _id: "$requestType",
                docs: { $push: "$$ROOT" },
            },
        },
    ]);
    const TQueue: IChargingQueue[] = [];
    const FQueue: IChargingQueue[] = [];
    // sort incrememtal queue
    queue.forEach((result) => {
        result.docs.forEach((doc, index) => {
            const updatedDoc = doc;
            updatedDoc.queueNumber = index + 1;
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

export async function activateReadyCharger(): Promise<void> {
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
                } else if (!chargingRequests) {
                    //
                    console.error(
                        ` database record not found when tring to find charging request(requestId: ${firstRequestIdInQueue}) from the head of chargingPile(Id:${chargingPile.chargingPileId})`
                    );
                } else {
                }
            }
        }
    } catch (error) {
        console.error("Error processing charging request:", error);
    }
}
export const getAvailablePiles = async (
    type: String
): Promise<AvailablePile[]> => {
    var availablePiles: AvailablePile[] = [];
    try {
        const piles = await ChargingPileModel.find({
            chargingType: type,
            status: ChargingPileStatus.running,
        });
        for (let pile of piles) {
            if (pile.queue.length < pile.maxQueue) {
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
    console.log(`dispatch flag: ${dispatchFlag}`);
    try {
        if (dispatchFlag) {
            if (
                process.env.DISPATCH == "default" ||
                process.env.DISPATCH == ""
            ) {
                await defaultDispatch();
            } else {
                await dispatchBatch();
            }
        } else {
            const hasPendingRequest = await ChargingRequestModel.find({
                status: ChargingRequestStatus.pending,
            }).exec();
            console.log(hasPendingRequest);
            if (hasPendingRequest.length == 0) {
                console.log("recovering from failure");
                await ChargingRequestModel.updateMany(
                    { status: ChargingRequestStatus.suspend },
                    { status: ChargingRequestStatus.pending }
                ).exec();
                toggleDispatchFlag(true);
            }
        }
        await Promise.all([sortChargingQueue(), activateReadyCharger()]);
        printQueue();
        printPile();

        return;
    } catch (error) {
        console.error(error);
        throw new Error("dispatch error");
    }
}

const printTime = async () => {
    console.log(getDate());
}
/**
 * Prints the current pile to the console.
 * For debugging purposes only.
 */
const printPile = async () => {
    const pile = await ChargingPileModel.find()
        .sort({ chargingPileId: 1 })
        .lean()
        .exec();
    console.log("Current pile:");
    console.table(pile);
};

/**
 * Prints the current queue to the console.
 * For debugging purposes only.
 */
const printQueue = async () => {
    const queue = await ChargingQueueModel.find()
        .sort({ requestType: 1, queueNumber: 1 })
        .lean()
        .exec();
    console.log("Current queue:");
    console.table(queue);
};
