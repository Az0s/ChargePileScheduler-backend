import express, { Router } from "express";
import {
    getQueueInfo,
    changeChargingRequest,
} from "../controllers/queueController.js";

const router: Router = express.Router();

router.get("/", getQueueInfo);
router.post("/change-request", changeChargingRequest);

export default router;
