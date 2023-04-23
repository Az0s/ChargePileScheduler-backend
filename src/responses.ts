// export default {
//     userNotFound: {
//         status: false,
//         data: {} as ResponseData,
//         message: "User not found.",
//     },
//     errorPassword: {
//         status: false,
//         data: {} as ResponseData,
//        message: "Error password.",
//     },
//     loginSuccessful: {
//         status: true,
//         data: {} as ResponseData,
//         message: "Login successfull.",
//     },
//     badRegister: {
//         status: false,
//         data: {} as ResponseData,
//         message: "Registration failed: Duplicate username or invalid password",
//     },
//     registerSuccessful: {
//         status: true,
//         data: {} as ResponseData,
//         message: "Register Successfull",
//     },
//     badPassword: {
//         status: false,
//         data: {} as ResponseData,
//         message: "Login failed: bad password.",
//     },

//     internalError: (param: responseParams) => {
//         return {
//             status: false,
//             data: param.data as ResponseData,
//             message: param.message ?? "Server internal error",
//         };
//     },
//     updatePwdOk: {
//         status: true,
//         data: {} as ResponseData,
//         message: "updatePwdOk",
//     },
//     unauthorized: {
//         status: false,
//         data: {} as ResponseData,
//         message: "Unauthorized. invalid jwt",
//     },
//     // message parts start
//     addMsgSuccessful: {
//         status: true,
//         data: {} as ResponseData,
//         message: "addMsgSuccessful",
//     },
//     getMessage: (param: responseParams = {}) => {
//         return {
//             status: true,
//             data: { messages: param.data ?? [] },
//             message: "getMessage",
//         };
//     },
//     // user starts
//     getUser: (param: responseParams = {}) => {
//         return {
//             status: true,
//             data: param.data ?? {},
//             message: "getUser",
//         };
//     },
// };
// export interface ResponseData {
//         accessToken?: string;
//         id?: string;
//         username?: string;
// }
// export interface responseParams {
//     data?: ResponseData;
//     message?: string;
// }