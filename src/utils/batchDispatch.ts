/* 扩展调度：
批量调度总充电时长最短：为了提高效率，假设只有当到达充电站的车辆等于充电区全部车位数量时，才开始进行一次批量调度充电，完成之后再进行下一批。规定进入充电区的一批车不再按照编号顺序依次调度，而是“统一调度”，系统调度策略为：(1)忽略每辆车的请求充电模式，所有车辆均可分配任意类型充电桩；(2)满足一批车辆完成充电总时长(所有车累计等待时间+累计充电时间)最短。例：如图1 所示，充电区总共有10 个车位，当到达充电站的车辆不少于10 辆时才能进行一次批量调度，此时按照编号顺序一次性叫号10 辆车同时进入充电区。进入充电区后，10 辆车不再按照编号顺序依次调度，而是统一进行分配。对于每辆车不考虑其充电模式，可分配任意类型充电桩，如何将10 辆车分配到对应的车位由调度策略决定，即满足10 辆车完成充电总时长(所有车累计等待时间+累计充电时间)最短

*/

/* 
批量调度总充电时长最短：为了提高效率，假设只有当到达充电站的车辆等于充电
区全部车位数量时，才开始进行一次批量调度充电，完成之后再进行下一批。规定
进入充电区的一批车不再按照编号顺序依次调度，而是“统一调度”，系统调度策
略为：(1)忽略每辆车的请求充电模式，所有车辆均可分配任意类型充电桩；(2)满
足一批车辆完成充电总时长(所有车累计等待时间+累计充电时间)最短。
例：如图1 所示，充电区总共有10 个车位，当到达充电站的车辆不少于10 辆时才
能进行一次批量调度，此时按照编号顺序一次性叫号10 辆车同时进入充电区。进
入充电区后，10 辆车不再按照编号顺序依次调度，而是统一进行分配。对于每辆
车不考虑其充电模式，可分配任意类型充电桩，如何将10 辆车分配到对应的车位
由调度策略决定，即满足10 辆车完成充电总时长(所有车累计等待时间+累计充电
时间)最短
*/

import ChargingPileModel, { ChargingPileStatus, IChargingPile } from "../models/ChargingPile.js";
import ChargingQueueModel, { IChargingQueue } from "../models/ChargingQueue.js";
import ChargingRequestModel, {
    ChargingRequestStatus,
} from "../models/ChargingRequest.js";
import {
    AvailablePile,
    getAccomplishTime,
    getAvailablePiles,
    IncrementalQueue,
    sortChargingQueue,
} from "./dispatch.js";
import { getDate } from "./timeService.js";
// used temporarily to sort things out
type ITempPile = {
    chargingPileId: string;
    chargingPower: number;
    queue: IChargingQueue[];
};
/**
 * Dispatches a batch of users to available charging piles based on the time it takes to accomplish the charging request.
 * The function assumes that the batch size is equal to the number of available charging piles.
 * The function ignores the charging mode of each vehicle and assigns any available charging pile.
 * The function selects the batch of vehicles that minimizes the total accomplish time (sum of waiting time and charging time).
 * @param {ChargingStation} station - The charging station object.
 * @returns {Promise<void>} - A promise that resolves when the batch dispatch is complete.
 */

export async function dispatchBatch(): Promise<void> {
    // ensuring every chargingpile is empty
    const count = await ChargingPileModel.countDocuments({
        "queue.0": { $exists: true },
    });
    if (count > 0) {
        return;
    } else {
        // otherwise dispatch in batch

        const userInQueue: IncrementalQueue = await sortChargingQueue();
        const totalQueue = [...userInQueue.TQueue, ...userInQueue.FQueue];
        const totalLength = totalQueue.length;
        // accumulate all the `maxQueue` in ChargingPileModel that is in state "available"
        const aggr = await ChargingPileModel.aggregate([
            {
                $match:{
                    status: ChargingPileStatus.running
                }
            },
            {
                $group: {
                    _id: null,
                    maxQueue: { $sum: "$maxQueue" },
                },
            },
        ]);
        const batchSize = aggr[0].maxQueue;

        if (batchSize === 0) {
            console.log("sum of all chargingPiles' maxQueue is 0");
            return;
        } else if (totalLength < batchSize) {
            console.log("totalLength < batchSize");
            return;
        } else {
            // dispatch a batch
            const chargingPiles: IChargingPile[] =
                await ChargingPileModel.find();
            /* ... */
            // Dispatch charging requests to charging piles
            //! WARN: assert pile.maxQueue === 2 and no charging pile failure present

            const tempPiles: ITempPile[] = chargingPiles.map(
                ({ chargingPileId, chargingPower }) => ({
                    // used in sorting
                    chargingPileId,
                    chargingPower,
                    queue: [],
                })
            );

            const dispatchTable: {
                chargingPileId: string;
                chargingRequestId: string[];
            }[] = [];

            let currentTime = getDate();
            for (const queue of totalQueue) {
                let minWaitTime = Infinity;
                let selectedPile: ITempPile | undefined;
                for (const chargingPile of tempPiles || []) {
                    if (chargingPile.queue.length === 2) continue;
                    const waitTime = calculateWaitTime(
                        chargingPile,
                        queue,
                        currentTime
                    );
                    if (waitTime < minWaitTime) {
                        minWaitTime = waitTime;
                        selectedPile = chargingPile;
                    }
                }
                if (selectedPile) {
                    selectedPile.queue.push(queue);
                    const existingDispatch = dispatchTable.find(
                        (dispatch) =>
                            dispatch.chargingPileId ===
                            selectedPile.chargingPileId
                    );
                    if (existingDispatch) {
                        existingDispatch.chargingRequestId.push(
                            queue.requestId
                        );
                    } else {
                        dispatchTable.push({
                            chargingPileId: selectedPile.chargingPileId,
                            chargingRequestId: [queue.requestId],
                        });
                    }
                }
            }
            console.log(dispatchTable);
            // update chargingPiles
            for (const table of dispatchTable) {
                // await to ensure queue is in order
                await Promise.all([
                    ChargingPileModel.updateOne(
                        { chargingPileId: table.chargingPileId },
                        {
                            $push: {
                                queue: { $each: table.chargingRequestId.map((id)=>({requestId: id})) },
                            },
                        }
                    ).exec(),
                    ChargingRequestModel.updateMany(
                        { requestId: { $in: table.chargingRequestId } },
                        { $set: { status: ChargingRequestStatus.dispatched } }
                    ).exec(),
                    ChargingQueueModel.deleteMany({
                        requestId: { $in: table.chargingRequestId },
                    }).exec(),
                ]);
            }
        }
    }
}

function calculateWaitTime(
    chargingPile: ITempPile,
    queue: IChargingQueue,
    currentTime: Date
): number {
    const queueLength = chargingPile.queue.length;
    const waitTime =
        queueLength === 0
            ? 0
            : chargingPile.queue[0].requestVolume / chargingPile.chargingPower;
    return (
        Math.max(0, waitTime) +
        currentTime.getTime() -
        queue.requestTime.getTime()
    );
}
