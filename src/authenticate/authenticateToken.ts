/**
 * middleware that authenticate jwt token
 */
// const jwt = require('jsonwebtoken');
// const responses = require('../responses');
import jwt from "jsonwebtoken";
// import responses from "../responses.js";
import User from "../models/User.js";
import { IResponse } from "../IResponse.js";

export const isUser = async (req, res: IResponse<null>, next) => {
    try {
        const userToken = getUserToken(req);
        await jwt.verify(userToken, process.env.ACCESS_TOKEN, (err, username) => {
            if (err) {
                res.status(401).send({ code: -1, message: "unauthorized token" });
            } else {
                // confirm user exists in db
                User.findOne({ userId: username.userId }, (err, user) => {
                    if (err) {
                        res.status(401).send({ code: -1, message: "user don't exist" });
                    } else if (!user) {
                        res.status(401).send({ code: -1, message: "user don't exist" });
                    }
                    else {
                        req.userId = user.userId;
                        next();
                    }
                });
            }
        });
    } catch (error) {
        res.status(401).send({ code: -1, message: "unauthorized token" });
        return;
    }
};
export const isAdmin = async (req, res, next) => {
    try {
        const userToken = getUserToken(req);
        await jwt.verify(
            userToken,
            process.env.ACCESS_TOKEN,
            async (err, username) => {
                if (err) {
                    res.status(401).send({ code: -1, message: "unauthorized token" });
                }
                // else {
                //     req.user = user.username;
                //     next();
                // }
                const user = await User.findOne({ userId: username.userId });
                const isAdmin = user.isAdmin;
                if (isAdmin) {
                    req.user = user.userId;
                    next();
                } else {
                    res.status(401).send({ code: -1, message: "not admin" });
                }
            }
        );
    } catch (error) {
        res.status(401).send({ code: -1, message: "unauthorized token" });
        return;
    }
};

const getUserToken = (req) => {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        return token;
    } else {
        // raise error
        throw new Error("no token found");
    }
};
