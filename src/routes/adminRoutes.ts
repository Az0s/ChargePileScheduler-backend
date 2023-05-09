import express, { Router } from "express";
import {
    getChargingPileStatus,
    updateChargingPile,
    getVehicleStatus,
    getQueueStatus,
    getReport,
} from "../controllers/adminController";

const router: Router = express.Router();

router.get("/query-all-piles_stat", getChargingPileStatus);
router.post("/update-pile", updateChargingPile);
router.get("/vehicle-status", getVehicleStatus);
router.get("/query-queue", getQueueStatus);
router.get("/query-report", getReport);

export default router;


