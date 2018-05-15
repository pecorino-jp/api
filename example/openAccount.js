const moment = require("moment");
const request = require("request-promise-native");

request.post({
    url: `http://localhost:8082/accounts`,
    auth: { bearer: process.env.TEST_ACCESS_TOKEN },
    json: true,
    simple: false,
    resolveWithFullResponse: true,
    body: {
        name: 'PECORINO TARO',
        initialBalance: 9999
    }
}).then((response) => {
    console.log('response:', response.statusCode, response.body);
}).catch(console.error);
