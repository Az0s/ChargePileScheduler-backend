import * as dotenv from 'dotenv';
import mongoose from "mongoose";

dotenv.config();
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;
// connect 
mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as mongoose.ConnectOptions);

// drop all collections in the database
mongoose.connection.once("open", async () => {
    console.log("Connected to MongoDB");
    // get all collection names from the database
    const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
    // drop each collection
    for (const collectionInfo of collections) {
        try {
            await mongoose.connection.dropCollection(collectionInfo.name);
            console.log(`Dropped collection: ${collectionInfo.name}`);
        } catch (error) {
            console.log(
                `Error dropping collection ${collectionInfo.name}: ${error}`
            );
        }
    }
    console.log("All collections dropped");
    // // create a new database with the specified name
    // await mongoose.connection.db.createCollection(DB_NAME);
    // console.log(`Created database: ${DB_NAME}`);
    mongoose.connection.close();
});