import express, { Router } from "express";
import {
    getChargingPileStatus,
    updateChargingPile,
    getQueueStatus,
    getReport,
} from "../controllers/adminController";

const router: Router = express.Router();

router.get("/query-all-piles_stat", getChargingPileStatus);
router.put("/update-pile", updateChargingPile);
router.get("/query-queue", getQueueStatus);
router.get("/query-report", getReport);

export default router;


