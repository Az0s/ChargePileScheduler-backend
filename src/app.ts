/*
 * @Date: 2022-09-20 16:21:26
 * @LastEditors: Azus
 * @LastEditTime: 2023-04-23 16:20:04
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
import { isAdmin, isUser } from "./authenticate/authenticateToken.js";
import authRouter from "./routes/authRoutes.js";
// import userRouter from "./routes/userRoutes.js";
import queueRouter from "./routes/queueRoutes.js";
import chargingRouter from "./routes/chargingRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import adminRouter from "./routes/adminRoutes.js";


const app = express();
app.use(cors());
app.use(express.json());
// keep-alive
app.get("/api/hello", (req: express.Request, res) => {
    res.status(200).send("hello");
});

app.use("/", authRouter);

// require user auth
app.use("/queue", isUser);
app.use("/charging", isUser);
app.use("/report", isUser);

app.use("/queue", queueRouter);
app.use("/charging", chargingRouter);
app.use("/report", reportRouter);
// require admin
app.use("/admin", isAdmin);
app.use("/admin", adminRouter);

// app.use("/user", isUser);
// app.use("/user", userRouter);



// app.use("/api/messages/", )

export default app;
