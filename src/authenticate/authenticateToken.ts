/**
 * middleware that authenticate jwt token
 */
// const jwt = require('jsonwebtoken');
// const responses = require('../responses');
import jwt from "jsonwebtoken";
import responses from "../responses.js";

export const authToken = async (req, res, next) => {
    try {
        const userToken = getUserToken(req);
        await jwt.verify(userToken, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) {
                res.status(401).send(responses.unauthorized);
            } else {
                req.user = user.username;
                next();
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

