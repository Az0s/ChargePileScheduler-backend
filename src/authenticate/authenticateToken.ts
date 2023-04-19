/**
 * middleware that authenticate jwt token
 */
// const jwt = require('jsonwebtoken');
// const responses = require('../responses');
import jwt from "jsonwebtoken";
import responses from "../responses.js";
import User from "../models/User.js";


export const isUser = async (req, res, next) => {
    try {
        const userToken = getUserToken(req);
        await jwt.verify(userToken, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) {
                res.status(401).send(responses.unauthorized);
            } else {
                req.userId = user.userId;
                next();
            }
        });
    } catch (error) {
        res.status(401).send(responses.unauthorized);
    }
};
export const isAdmin = async (req, res, next) => {
    try {
        const userToken = getUserToken(req);
        await jwt.verify(userToken, process.env.ACCESS_TOKEN, async (err, user) => {
            if (err) {
                res.status(401).send(responses.unauthorized);
            }
            // else {
            //     req.user = user.username;
            //     next();
            // }
            const { username } = user;
            const isAdmin = await User.findOne({ username }).select('isAdmin');
            if (isAdmin) {
                req.user = user.username;
                next();
            }
            else {
                res.status(401).send(responses.unauthorized);
            }
        });
    } catch (error) {
        res.status(401).send(responses.unauthorized);
    }
};

const getUserToken = (req) => {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        return token;
    }
    else{
        // raise error
        throw new Error("no token found");
    }
};

