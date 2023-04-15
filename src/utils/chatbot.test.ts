// test ./chat_nlp.js
const chat_response = require("./chatbot");
const userid = "test";
const query = "你好";
describe("chatbot", () => {
    it("chatbot", async () => {
        const response = await chat_response(userid, query);
        expect(response).toMatchObject({
                Confidence: expect.any(Number),
                Reply: expect.any(String),
                RequestId: expect.any(String),
        });
    });
});
