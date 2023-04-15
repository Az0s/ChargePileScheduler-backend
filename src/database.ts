import mongoose from "mongoose";
export default function connect_database(MONGO_URL: string) {
    mongoose
        .connect(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as mongoose.ConnectOptions)
        .then(() => {
            console.log("DB Connetion Successful at " + MONGO_URL);
        })
        .catch((err: Error) => {
            console.log(err.message);
        });
};
