/*
 * @Date: 2022-09-19 20:56:26
 * @LastEditors: Azus
 * @LastEditTime: 2023-04-15 11:07:02
 * @FilePath: /ChargePileScheduler/src/index.ts
 * @Description: set up express server, connect to database, and listen to socket port
 */

// const app = require("./src/app");
// const { createServer } = require("http");
// const { Server, Socket} = require("socket.io");
// const mongoose = require("mongoose");
// change to es6 module:

// if distributed auth server is required:
// const authApp = require("./authApp");
// const authServer = authApp.listen(process.env.AUTH_PORT, () => {
//     console.log(`authentication server running at ${process.env.AUTH_PORT}`);
// });

import fs from "fs";
import app from "./app.js";
import { createServer } from "https";
import { Server, Socket } from "socket.io";
import  connect_database  from "./database.js";
import dotenv from "dotenv";

dotenv.config();
const USE_SOCKET: boolean = Boolean(process.env.USE_SOCKET as string);
connect_database(process.env.MONGO_URL as string);


var privateKey = fs.readFileSync(
    "private.pem"
);
var certificate = fs.readFileSync(
    "origin_ca_rsa_root.pem"
);
const httpServer = createServer(
    {
        key: privateKey,
        cert: certificate,
    },
    app
);

//* init http server to bind socket.io to 
// const server = app.listen(process.env.PORT, () => {
//     console.log(`server running at ${process.env.PORT}`);
// });

if (USE_SOCKET) {
    // listen socket port
    const onlineUser = new Map();
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // allow all origins
            // methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket: Socket) => {
        // say hello to client
        socket.emit("hello", "hello from server");

        socket.on("disconnect", () => {
            onlineUser.delete(socket.id);
        });
    });
}
httpServer.listen(process.env.PORT, () => {
    console.log(`server running at ${process.env.PORT}`);
});
