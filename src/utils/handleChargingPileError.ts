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
            const currentUserId = await ChargingRequestModel.findOne({
                requestId: currentRequestId,
            })
                .select("userId")
                .exec();
            if (currentUserId) {
                await handleChargingEnd(currentUserId.userId);
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
        }
        // dispatchFlag will be toggled when all previously dispatched requests are dispatched to new pile

        // Re-dispatch vehicles in the error queue
        await dispatch();

        // Resume the calling service of the waiting area after dispatching all vehicles in the error queue
    } catch (error) {
        console.error("Error handling charging pile error:", error);
        throw new Error("Error handling charging pile error");
    }
}
