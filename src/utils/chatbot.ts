// Depends on tencentcloud-sdk-nodejs version 4.0.3 or higher
const tencentcloud = require("tencentcloud-sdk-nodejs");
const NlpClient = tencentcloud.nlp.v20190408.Client;
require("dotenv").config();

// 实例化一个认证对象，入参需要传入腾讯云账户secretId，secretKey,此处还需注意密钥对的保密
// 密钥可前往https://console.cloud.tencent.com/cam/capi网站进行获取
const clientConfig = {
    credential: {
        secretId: process.env.TENCENT_CLOUD_ID,
        secretKey: process.env.TENCENT_CLOUD_KEY,
    },
    region: "ap-guangzhou",
    profile: {
        httpProfile: {
            endpoint: "nlp.tencentcloudapi.com",
        },
    },
};

// 实例化要请求产品的client对象,clientProfile是可选的
const client = new NlpClient(clientConfig);
const chatbot = (userid, query) => {
    const params = {
        OpenId: userid,
        Flag: 0,
        Query: query,
    };
    // client.ChatBot(params).then(
    //     (data) => {
    //         console.log(data);
    //     },
    //     (err) => {
    //         console.error("error", err);
    //     }
    // );
    return new Promise((resolve, reject) => {
        client.ChatBot(params).then(
            (data) => {
                resolve(data);
            },
            (err) => {
                reject(err);
            }
        );
    })
};

module.exports = chatbot;

// Path: server/utils/chat_nlp.js
