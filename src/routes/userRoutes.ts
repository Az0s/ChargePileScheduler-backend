// const { getAllUsers } = require("../controllers/userControllers");

import { getAllUsers } from "../controllers/userControllers.js";
import express from "express"
const router = express.Router();

router.get("/getalluser", getAllUsers);

export default router;
