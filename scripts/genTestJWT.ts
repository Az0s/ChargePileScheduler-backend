// import { generateUserToken } from "../src/controllers/authController";
// import { User } from "../src/models/User";
import jwt from "jsonwebtoken";
const getJWT = async () => {
    const generateUserToken = (user) => {
        return jwt.sign(user, process.env.ACCESS_TOKEN);
    };

    const jwts = [];
    const users = ["test", "test1", "test2"];
    console.log("Generating JWTs for users: " + users);
    users.forEach(async (username) => {
        const jwt = await generateUserToken(username);
        jwts.push(jwt);
        console.log(jwt);
    });
    return jwts;
};
getJWT();
