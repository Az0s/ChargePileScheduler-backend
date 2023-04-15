// ! NOTE: This code file needs to be rewritten to improve its structure and readability. The changes to be made include [implement universal mongod variable to work with typescript].
// /**
//  * provide functions to connect to mongodb
//  * momory server in convenience of unit testing.
//  */

// const mongoose = require("mongoose");
// const { MongoMemoryServer } = require("mongodb-memory-server");

// // const mongod = (async () => {
// //     return await MongoMemoryServer.create();
// // })();
// let mongod;
// /**
//  * connet to db
//  */
// export const connect = async () => {
//     mongod = await MongoMemoryServer.create();
//     const uri = mongod.getUri();
//     const mongooseOpts = {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     };
//     await mongoose.connect(uri, mongooseOpts);
// };

// /**
//  * disconnect and close connection
//  */
// export const disconnect = async () => {
//     await mongoose.connection.dropDatabase();
//     await mongoose.connection.close();
//     await mongod.stop();
// };
// /**
//  * clear all databases
//  */
// export const clearDatabase = async () => {
//     const collections = mongoose.connection.collections;
//     for (const key in collections) {
//         const collection = collections[key];
//         await collection.deleteMany();
//     }
// };

// export{}