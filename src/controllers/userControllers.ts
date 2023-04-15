// const User = require("../models/userModel");
// const { getUser } = require("../responses");
import User from "../models/User.js";
import responses , {ResponseData, responseParams} from "../responses.js";

export const getAllUsers = async (req, res) => {
    const users = await User.find({});

    res.status(200).send(
        responses.getUser({
            data: users.map((user) => {
                return { username: user.username, id: user.id };
            }),
        } as responseParams)
    );
};
