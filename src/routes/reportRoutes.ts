import express, { Router } from "express";
import { getChargingReport } from "../controllers/reportController.js";

const router: Router = express.Router();

router.get("/charging", getChargingReport);

export default router;
