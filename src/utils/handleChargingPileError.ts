import ChargingPileModel, {
    IChargingPile,
    ChargingPileStatus,
} from "../models/ChargingPile.js";
import { v4 as uuidv4 } from "uuid";

import ChargingQueueModel from "../models/ChargingQueue.js";
import ChargingRecordModel from "../models/ChargingRecord.js";
import ChargingRequestModel, {
    ChargingRequestStatus,
    IChargingRequest,
} from "../models/ChargingRequest.js";
import { getDate, getTimestamp } from "./timeService.js";

import dispatch, { toggleDispatchFlag } from "./dispatch.js";
import handleChargingEnd from "./handleChargingEnd.js";

// TODO 测试该函数是否正确
export async function handleChargingPileError(
    chargingPileId: string
): Promise<void> {
    try {
        // Find the charging pile with error
        const chargingPile: IChargingPile | null =
            await ChargingPileModel.findOne({
                chargingPileId: chargingPileId,
            }).exec();

        if (!chargingPile) {
            console.error("Charging pile not found");
            throw new Error("Charging pile not found");
        }
        if (chargingPile.queue.length != 0) {
            // Stop charging and billing for the current charging vehicle
            const currentRequestId = chargingPile.queue[0].requestId;
            const currentUserRequest = await ChargingRequestModel.findOne({
                requestId: currentRequestId,
            }).exec();
            const currentUserId = currentUserRequest.userId;
            if (currentUserId) {
                const lastChargingData = await handleChargingEnd(currentUserId);
                const rId: string = "resume"+uuidv4().slice(6);

                // create new request and queue for the first user
                await ChargingRequestModel.create({
                    requestId: rId,
                    userId: currentUserId,
                    requestMode: currentUserRequest.requestMode,
                    // would be original_request_volume - lastChargingData.volume
                    requestVolume:
                        currentUserRequest.requestVolume -
                        lastChargingData.volume,
                    status: ChargingRequestStatus.pending,
                    requestTime: getDate(),
                    batteryAmount: currentUserRequest.batteryAmount,
                } as IChargingRequest);
                await ChargingQueueModel.create({
                    userId: currentUserRequest.userId,
                    queueNumber: 0,
                    requestType: currentUserRequest.requestMode,
                    requestTime: getDate(),
                    requestId: rId,
                    requestVolume:
                        currentUserRequest.requestVolume -
                        lastChargingData.volume,
                });
            }
        }
        // Suspend the calling service of the waiting area
        toggleDispatchFlag(false);
        // set all previously pending request to suspend
        await ChargingRequestModel.updateMany(
            { status: ChargingRequestStatus.pending },
            { status: ChargingRequestStatus.suspend }
        ).exec();
        // Dispatch vehicles in the error charging pile queue
        const errorQueue = chargingPile.queue.slice(1); // Remove the first item, which was already stopped charging
        for (const queueItem of errorQueue) {
            const request: IChargingRequest | null =
                await ChargingRequestModel.findOne({
                    requestId: queueItem.requestId,
                }).exec();
            if (request) {
                request.status = ChargingRequestStatus.pending;
                await request.save();
            }
            await ChargingQueueModel.create({
                userId: request.userId,
                queueNumber: 1,
                requestType: request.requestMode,
                requestTime: getDate(),
                requestId: request.requestId,
                requestVolume: request.requestVolume,
            });
        }
        // clear the errored pile  queue
        await Promise.all([
            ChargingPileModel.updateMany(
                {
                    chargingPileId: chargingPileId,
                },
                {
                    $set: {
                        queue: [],
                    },
                }
            ).exec(),
        ]);

        // dispatchFlag will be toggled when all previously dispatched requests are dispatched to new pile

        // Re-dispatch vehicles in the error queue
        await dispatch();

        // Resume the calling service of the waiting area after dispatching all vehicles in the error queue
    } catch (error) {
        console.error("Error handling charging pile error:", error);
        throw new Error("Error handling charging pile error");
    }
}
