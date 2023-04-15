// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const responses = require("../responses");
// const User = require("../models/userModel");
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import responses from "../responses.js";
import User from "../models/User.js";
import dotenv from "dotenv"

dotenv.config();

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @return {obj} {status, data:{userToken, id}, message}
 */
export const login = async (req, res) => {
    // console.log(`login request into user ${req.body["username"]}`)
    const username = req.body["username"];
    const password = req.body["password"];
    const usr = await User.findOne({ username: username });
    if (!usr) {
        res.status(404).send(responses.userNotFound);
    } else if (await bcrypt.compare(password, usr.password)) {
        // good password

        // jwt token
        const userToken = generateUserToken({ username });
        const response = responses.loginSuccessful;
        response.data.accessToken = userToken;
        response.data.id = usr.id;
        response.data.username = usr.username;
        res.status(200).send(response);
    } else {
        res.status(401).send(responses.badPassword);
    }
};

export const register = async (req, res, next) => {
    const username = req.body["username"];
    const password = req.body["password"];
    User.findOne({ username })
        .then(async (document) => {
            if (document) {
                // if username already exists
                res.status(400).send(responses.badRegister);
                return;
            }
            const crypt_password = await bcrypt.hash(password, 10);
            await User.create({
                username,
                password: crypt_password,
            });
            res.status(200).send(responses.registerSuccessful);
        })
        .catch((err) => {
            res.status(500).send(
                responses.internalError({
                    message: `internalError. bad db request when User.findOne({ username }) `,
                })
            );
        });
};
// // input:{
//     // body:{
//         //  number1: 1
//         //  number2: 1
//     // }
// // }

// // output: 
//     // result: 2
// export const calculate =  async (req, res) => { 
//     const number1 = req.body("number1") 
//     const number2 = req.body("number2") 
//     const result = number1 + number2
//     res.status(200).send(
//         {
//         status: "success",
//         data: result
//         }
//     );
// }

// result = request("/calculate", {
//     number1: 1, 
//     number2: 2
// })
// print(result.data)

export const checkAuth = async (req, res) => {
    res.status(200).send({
        status: "success",
        data: {
            username: req.user,
        },
        message: "valid jwt.",
    });
};
export const setPassword = async (req, res) => {
    const username = req.user;
    const password = req.body["password"];
    const new_password = req.body["new_password"];
    const ori_pwd = (await User.findOne({ username })).password;
    if (await bcrypt.compare(password, ori_pwd)) {
        try {User.updateOne(
                { username },
                { password: await bcrypt.hash(new_password, 10) }
            );
        } catch (err) {
            res.status(500).send(
                responses.internalError({
                    message: `internalError. Error while updateOne`,
                })
            );
        }
        res.status(200).send(responses.updatePwdOk);
    } else {
        res.status(400).send(responses.badPassword);
    }
};

const generateUserToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN);
};



