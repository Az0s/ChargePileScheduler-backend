import express, { Router } from "express";
import {
    requestCharging,
    submitChargingResult,
    cancelCharging,
    getRemainAmount,
} from "../controllers/chargingController";

const router: Router = express.Router();

router.post("/request", requestCharging);
router.post("/submit", submitChargingResult);
router.post("/cancel", cancelCharging);
router.get("/remainAmount", getRemainAmount);

export default router;
