import express, { Router } from "express";
import {
    getChargingStationStatus,
    toggleChargingStation,
    getVehicleStatus,
} from "../controllers/adminController";

const router: Router = express.Router();

router.get("/charging-station-status", getChargingStationStatus);
router.post("/toggle-charging-station", toggleChargingStation);
router.get("/vehicle-status", getVehicleStatus);

export default router;


