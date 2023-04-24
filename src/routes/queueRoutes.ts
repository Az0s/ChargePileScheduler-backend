import express, { Router } from "express";
import {
    getQueueInfo,
    changeChargingRequest,
} from "../controllers/queueController.js";

const router: Router = express.Router();

router.get("/info", getQueueInfo);
router.post("/change", changeChargingRequest);

export default router;
