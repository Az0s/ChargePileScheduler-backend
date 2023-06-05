import ChargingPileModel from "../models/ChargingPile.js";
import ChargingQueueModel, { IChargingQueue } from "../models/ChargingQueue.js";
import ChargingRequestModel, {
    ChargingRequestStatus,
} from "../models/ChargingRequest.js";
import { AvailablePile, getAccomplishTime } from "./dispatch.js";
import {
    getAvailablePiles,
    IncrementalQueue,
    sortChargingQueue,
} from "./dispatch.js";

export const defaultDispatch = async () => {
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
};
/**
 * Dispatches users from the user queue to available charging piles based on the time it takes to accomplish the charging request.
 * @param {AvailablePile[]} availablePiles - An array of available charging piles.
 * @param {IChargingQueue[]} userQueue - An array of user requests in the queue.
 * @returns {Promise<number[]>} - An array of user IDs that have been dispatched.
 */
export const dispatchAwaitingUser = async (
    availablePiles: AvailablePile[],
    userQueue: IChargingQueue[] // mutating
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
