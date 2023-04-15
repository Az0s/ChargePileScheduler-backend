const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { connect } = require("./utils/memory_db");
require("dotenv").config();
const responses = require("./responses");

// mongoose
//     .connect("mongodb://localhost:27017/chatapp", {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     })
//     .then(() => {
//         console.log("DB Connetion Successfull");
//     })
//     .catch((err) => {
//         console.log(err.message);
//     });

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        max: 10,
        min: 3,
        required: true,
    },
    password: {
        type: String,
        max: 20,
        min: 8,
        required: true,
    },
});
const usermodol_and_insert = async () => {
    const usermodel = mongoose.model("Users", userSchema);
    // usermodel.create({
    //     username: "test",
    //     password: "test",
    // });
    console.log(
        await usermodel.findOneAndUpdate(
            { username: "test" },
            { password: await bcrypt.hash("qwer1234", 10) }
        )
    );
    console.log(await usermodel.find);
};
export {};