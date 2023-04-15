/*
 * @Date: 2022-09-20 16:21:26
 * @LastEditors: Azus
 * @LastEditTime: 2023-04-15 10:44:39
 * @FilePath: /ChargePileScheduler/src/app.ts
 * @Description: configure express app
 */
// const express = require("express");
// const cors = require("cors");
// const {authToken} = require("./authenticate/authenticateToken");
// const authRouter = require("./routes/authRoutes");
// change to es6 module imports:
import express from "express";
import cors from "cors";
import { authToken } from "./authenticate/authenticateToken.js";
import authRouter from "./routes/authRoutes.js";

import userRouter from "./routes/userRoutes.js";

import queueRouter from "./routes/queueRoutes.js";
import chargingRouter from "./routes/chargingRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import adminRouter from "./routes/adminRoutes.js";


const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/hello", (req: express.Request, res) => {
    res.status(200).send("hello");
});

app.use("/api/auth", authRouter);

app.use("/api/queue", queueRouter);
app.use("/api/charging", chargingRouter);
app.use("/api/report", reportRouter);
app.use("/api/admin", adminRouter);

app.use("/api/messages", authToken);
app.use("/api/user", authToken);
app.use("/api/user", userRouter);

app.get("/", (_, res) => {
    console.log("/");
    res.status(200).send("hw");
});

// app.use("/api/messages/", )

export default app;
