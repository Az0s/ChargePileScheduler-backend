// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const responses = require("../responses");
// const User = require("../models/userModel");
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
// import responses from "../responses.js";
import User from "../models/User.js";
import validateAdminKey from "../authenticate/validateAdminKey.js";
import { Request, Response, NextFunction } from "express";
import { ResponseData, LoginData, IResponse } from "../IResponse.js";
import { stringify } from "querystring";

interface registerRequest {
    body: { username: string; password: string; key: string };
}
interface loginRequest {
    body: { username: string; password: string };
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @return {obj} {status, data:{userToken, id}, message}
 */
export const login = async (req, res: IResponse<null>) => {
    // console.log(`login request into user ${req.body["username"]}`)
    const username = req.body["username"];
    const password = req.body["password"];
    const usr = await User.findOne({ username: username });
    if (!usr) {
        res.status(404).send({
            code: -1,
            message: "user not found",
        });
        return;
    } else if (await bcrypt.compare(password, usr.password)) {
        // good password
        // jwt token, userId as payload
        const userId = usr.userId;
        const userToken = generateUserToken({ userId });
        const loginData: LoginData = {
            token: userToken,
            is_admin: usr.isAdmin,
        };
        const response = {
            code: 0,
            message: "login successful",
            data: loginData,
        };
        res.status(200).send(response);
    } else {
        res.status(401).send({
            code: -1,
            message: "wrong password",
        });
    }
};

export const register = async (
    req: registerRequest,
    res: IResponse<null>,
    next: NextFunction
) => {
    const username = req.body["username"];
    const password = req.body["password"];
    const key = req.body["key"];
    let isAdmin = false;
    if (key) {
        isAdmin = validateAdminKey(key);
        if (!isAdmin) {
            res.status(401).send({
                code: -1,
                message: "invalid admin key",
            });
            return;
        }
    }
    // valid admin key
    User.findOne({ username })
        .then(async (document) => {
            if (document) {
                // if username already exists
                res.status(400).send({
                    code: -1,
                    message: "username already exists",
                });
                return;
            }
            const crypt_password = await bcrypt.hash(password, 10);
            await User.create({
                username,
                password: crypt_password,
                isAdmin: isAdmin,
            });
            res.status(200).send({
                code: 0,
                message:
                    "register successful as" + (isAdmin ? " admin" : " user"),
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send({
                code: -1,
                message: "internal error. Check server log or data for details",
                data: { error: stringify(err) },
            });
        });
};
// export const checkAuth = async (req, res) => {
//     res.status(200).send({
//         status: "success",
//         data: {
//             username: req.user,
//         },
//         message: "valid jwt.",
//     });
// };
// export const setPassword = async (req, res) => {
//     const username = req.user;
//     const password = req.body["password"];
//     const new_password = req.body["new_password"];
//     const ori_pwd = (await User.findOne({ username })).password;
//     if (await bcrypt.compare(password, ori_pwd)) {
//         try {
//             User.updateOne(
//                 { username },
//                 { password: await bcrypt.hash(new_password, 10) }
//             );
//         } catch (err) {
//             res.status(500).send(
//                 responses.internalError({
//                     message: `internalError. Error while updateOne`,
//                 })
//             );
//         }
//         res.status(200).send(responses.updatePwdOk);
//     } else {
//         res.status(400).send(responses.badPassword);
//     }
// };

const generateUserToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN);
};
