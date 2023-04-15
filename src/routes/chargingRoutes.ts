import express, { Router } from "express";
import {
    requestCharging,
    submitChargingResult,
    cancelCharging,
} from "../controllers/chargingController";

const router: Router = express.Router();

router.post("/request", requestCharging);
router.post("/submit", submitChargingResult);
router.post("/cancel", cancelCharging);

export default router;
