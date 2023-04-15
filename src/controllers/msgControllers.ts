// // const user = require("../models/userModel");
// // const msg = require("../models/msgModel");
// // const { addMsgSuccessful, getMessage, internalError } = require("../responses");
// import user from "../models/User.js";
// import msg from "../models/msgModel.js";
// // import { addMsgSuccessful, getMessage, internalError } from "../responses";
// import responses, {ResponseData, responseParams} from "../responses.js";



// /**
//  *
//  * @param {*} req
//  * @param {*} res
//  * @return {obj} {status, data:{}, message}
//  */
// export const addmsg = async (req, res) => {
//     const sender = req.user;
//     const receivers = req.body["to"];
//     const message = req.body["message"];
//     const usr = await user.findOne({ username: sender });
//     if (!usr) {
//         res.status(404).send(responses.userNotFound);
//     } else {
//         try {
//             await msg.create({
//                 sender: usr.id,
//                 receivers: [{ _id: receivers }, { _id: usr.id }],
//                 message: { text: message.text },
//             });
//             res.status(200).send(responses.addMsgSuccessful);
//         } catch (err) {
//             res.status(500).send(
//                 responses.internalError({ message: err.message })
//             );
//         }
//     }
// };

// /**
//  *
//  * @param {*} req:{from: string}
//  * @param {*} res
//  */
// export const getmsg = async (req, res) => {
//     const request_sender = req.user;
//     const receiver = req.body["with"];
//     try {
//         const usr = await user.findOne({ username: request_sender });
//         const usr2 = await user.findOne({ _id: receiver });
//         // as the 'request_sender' is queryin' for all the messages that sent to him and the 'receiver'
//         // const msgs = await msg
//         //     .find({
//         //         receivers: { $all: [({ _id: usr.id }, { _id: usr2.id })] },
//         //     })
//         //     .sort({ updatedAt: 1 });
//         const msgs = await msg
//             .find({
//                 $and: [
//                     {
//                         receivers: { _id: usr.id },
//                     },
//                     {
//                         receivers: {
//                             _id: usr2.id,
//                         },
//                     },
//                 ],
//             })
//             .sort({ updatedAt: 1 });
//         res.status(200).send(responses.getMessage({ data: msgs } as responseParams));
//     } catch (err) {
//         res.status(500).send(responses.internalError({ message: err.message }));
//     }
// };

