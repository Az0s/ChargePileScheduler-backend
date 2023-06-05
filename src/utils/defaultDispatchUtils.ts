import ChargingPileModel, {
    IChargingPile,
    ChargingPileStatus,
} from "../models/ChargingPile.js";
import ChargingQueueModel, {IChargingQueue} from "../models/ChargingQueue.js";
import ChargingRecordModel from "../models/ChargingRecord.js";
import ChargingRequestModel, {
    ChargingRequestStatus,
    IChargingRequest,
} from "../models/ChargingRequest.js";
import { getDate, getTimestamp } from "./timeService.js";

