const moment = require("moment");
const request = require("request-promise-native");

const accessToken = 'eyJraWQiOiI0eVpocWlFZlFRVEVmSTNERlA1ZjBWQXpwazFLekFBa3RQd2haSGZHdzBzPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhZWJhZjU3My05OGMxLTRjZWEtODRiZi1lMjBlYmRjNjg2OWEiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIG9wZW5pZCBwcm9maWxlIGh0dHBzOlwvXC9zc2t0cy1hcGktZGV2ZWxvcG1lbnQuYXp1cmV3ZWJzaXRlcy5uZXRcL3BsYWNlcy5yZWFkLW9ubHkgaHR0cHM6XC9cL3Nza3RzLWFwaS1kZXZlbG9wbWVudC5henVyZXdlYnNpdGVzLm5ldFwvcGVvcGxlLmNyZWRpdENhcmRzLnJlYWQtb25seSBodHRwczpcL1wvc3NrdHMtYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC9wZW9wbGUuY29udGFjdHMgaHR0cHM6XC9cL3Nza3RzLWFwaS1kZXZlbG9wbWVudC5henVyZXdlYnNpdGVzLm5ldFwvcGVvcGxlLmNvbnRhY3RzLnJlYWQtb25seSBodHRwczpcL1wvc3NrdHMtYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC9wZW9wbGUub3duZXJzaGlwSW5mb3MgaHR0cHM6XC9cL3Nza3RzLWFwaS1kZXZlbG9wbWVudC5henVyZXdlYnNpdGVzLm5ldFwvcGVvcGxlLm93bmVyc2hpcEluZm9zLnJlYWQtb25seSBodHRwczpcL1wvcGVjb3Jpbm8tYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC90cmFuc2FjdGlvbnMgcGhvbmUgaHR0cHM6XC9cL3Nza3RzLWFwaS1kZXZlbG9wbWVudC5henVyZXdlYnNpdGVzLm5ldFwvZXZlbnRzLnJlYWQtb25seSBodHRwczpcL1wvc3NrdHMtYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC9vcmdhbml6YXRpb25zLnJlYWQtb25seSBodHRwczpcL1wvc3NrdHMtYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC9vcmRlcnMucmVhZC1vbmx5IGh0dHBzOlwvXC9zc2t0cy1hcGktZGV2ZWxvcG1lbnQuYXp1cmV3ZWJzaXRlcy5uZXRcL3Blb3BsZS5jcmVkaXRDYXJkcyBodHRwczpcL1wvc3NrdHMtYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC90cmFuc2FjdGlvbnMgZW1haWwiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTFfbG5xVWV2aVhqIiwiZXhwIjoxNTE3Mjk2MzUxLCJpYXQiOjE1MTcyOTI3NTIsInZlcnNpb24iOjIsImp0aSI6ImE1ODBlYjcxLWYzYWYtNDBjMi05NmEzLTQ3MmNjZjJkYTQ2OSIsImNsaWVudF9pZCI6Iml0MjA3b2VhdGJkN2ZqZGN2c2Yzcm1za3UiLCJ1c2VybmFtZSI6Imlsb3ZlZ2FkZCJ9.CW7mDzepZFEfybq-FBPDmlq6ueS88whhdPXux2iflJ3N4btqThhLXDLqKdIaYhRevvp2NAnlo-m9va0jPAhQJt6G0J8X4uf3bGJgjJu0uUb2cyIuWkW-EXynJH19_mynuDJfY71V0AG6rYJ_KeNOeVbFxsR6BZievCdz0voSz_6r_NVGQwEdWUmPS5cYHUyvU8m1wkUcyv-WWusGXmlMo4TgEDwRbS1HT2jcBViMfNjzsAGEi5x5fMl-ANss8ThH4axg5-mLzzc8g5byUqi0jOI3WxTdI49SFytN6MIUFQ4nLeOdWDsfdtv1RGUBJNYJwuN_esZujE_JUKKsMiyvjQ';

request.post({
    url: `http://localhost:8081/transactions/deposit/start`,
    auth: { bearer: accessToken },
    body: {
        toAccountId: 'accountId',
        expires: moment().add(1, 'hour').toISOString(),
        agent: {
            typeOf: 'Person',
            id: 'agentId',
            name: 'agentName',
            url: 'https://example.com'
        },
        recipient: {
            typeOf: 'Person',
            id: 'recipientId',
            name: 'recipientName',
            url: 'https://example.com'
        },
        price: 100
    },
    json: true,
    simple: false,
    resolveWithFullResponse: true
}).then((response) => {
    console.log('response:', response.statusCode, response.body);

    request.post({
        url: `http://localhost:8081/transactions/deposit/${response.body.id}/confirm`,
        auth: { bearer: accessToken },
        body: {
        },
        json: true,
        simple: false,
        resolveWithFullResponse: true
    }).then((response) => {
        console.log('response:', response.statusCode, response.body);
    }).catch(console.error);
}).catch(console.error);
