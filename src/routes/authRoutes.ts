// const {
//     login,
//     register,
//     checkAuth,
//     setPassword
// } = require("../controllers/authControllers");
// const {authToken} = require("../authenticate/authenticateToken");
// const router = require('express').Router();
import {
    login,
    register,
    checkAuth,
    setPassword,
} from "../controllers/authControllers.js";
import { authToken } from "../authenticate/authenticateToken.js";
import { Router } from "express";

const router = Router();

router.post("/login", login)
router.post("/register", register)

router.use("/auth", authToken);
router.post("/auth", checkAuth)

router.use("/reset-password", authToken);
router.post("/reset-password", setPassword);

export default router;

