const AWS = require('aws-sdk');

function getUserByAccessToken(accesssToken) {
    return async () => {
        return new Promise((resolve, reject) => {
            const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
                apiVersion: 'latest',
                region: 'ap-northeast-1'
            });

            cognitoIdentityServiceProvider.getUser(
                {
                    AccessToken: accesssToken
                },
                (err, data) => {
                    if (err instanceof Error) {
                        reject(err);
                    } else {
                        const userAttributes = data.UserAttributes;
                        resolve(userAttributes);
                    }
                });
        });
    };
}

function updateUserByAccessToken(accesssToken) {
    return async () => {
        return new Promise((resolve, reject) => {
            const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
                apiVersion: 'latest',
                region: 'ap-northeast-1'
            });

            cognitoIdentityServiceProvider.updateUserAttributes(
                {
                    AccessToken: accesssToken,
                    UserAttributes: [
                        {
                            Name: 'custom:pecorinoAccountId',
                            Value: 'accountId'
                        }
                    ]
                },
                (err, data) => {
                    if (err instanceof Error) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
        });
    };
}

const accesssToken = 'eyJraWQiOiI0eVpocWlFZlFRVEVmSTNERlA1ZjBWQXpwazFLekFBa3RQd2haSGZHdzBzPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhZWJhZjU3My05OGMxLTRjZWEtODRiZi1lMjBlYmRjNjg2OWEiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIG9wZW5pZCBwcm9maWxlIGh0dHBzOlwvXC9zc2t0cy1hcGktZGV2ZWxvcG1lbnQuYXp1cmV3ZWJzaXRlcy5uZXRcL3BsYWNlcy5yZWFkLW9ubHkgaHR0cHM6XC9cL3Nza3RzLWFwaS1kZXZlbG9wbWVudC5henVyZXdlYnNpdGVzLm5ldFwvcGVvcGxlLmNyZWRpdENhcmRzLnJlYWQtb25seSBodHRwczpcL1wvc3NrdHMtYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC9wZW9wbGUuY29udGFjdHMgaHR0cHM6XC9cL3Nza3RzLWFwaS1kZXZlbG9wbWVudC5henVyZXdlYnNpdGVzLm5ldFwvcGVvcGxlLmNvbnRhY3RzLnJlYWQtb25seSBodHRwczpcL1wvc3NrdHMtYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC9wZW9wbGUub3duZXJzaGlwSW5mb3MgaHR0cHM6XC9cL3Nza3RzLWFwaS1kZXZlbG9wbWVudC5henVyZXdlYnNpdGVzLm5ldFwvcGVvcGxlLm93bmVyc2hpcEluZm9zLnJlYWQtb25seSBwaG9uZSBodHRwczpcL1wvc3NrdHMtYXBpLWRldmVsb3BtZW50LmF6dXJld2Vic2l0ZXMubmV0XC9ldmVudHMucmVhZC1vbmx5IGh0dHBzOlwvXC9zc2t0cy1hcGktZGV2ZWxvcG1lbnQuYXp1cmV3ZWJzaXRlcy5uZXRcL29yZ2FuaXphdGlvbnMucmVhZC1vbmx5IGh0dHBzOlwvXC9zc2t0cy1hcGktZGV2ZWxvcG1lbnQuYXp1cmV3ZWJzaXRlcy5uZXRcL29yZGVycy5yZWFkLW9ubHkgaHR0cHM6XC9cL3Nza3RzLWFwaS1kZXZlbG9wbWVudC5henVyZXdlYnNpdGVzLm5ldFwvcGVvcGxlLmNyZWRpdENhcmRzIGh0dHBzOlwvXC9zc2t0cy1hcGktZGV2ZWxvcG1lbnQuYXp1cmV3ZWJzaXRlcy5uZXRcL3RyYW5zYWN0aW9ucyBlbWFpbCIsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMV9sbnFVZXZpWGoiLCJleHAiOjE1MTcyNzYzMDksImlhdCI6MTUxNzI3MjcwOSwidmVyc2lvbiI6MiwianRpIjoiNjY5MDhjZjYtMTZlZS00NGFhLWFmODYtZjQ5NzdiNTc1ZTFmIiwiY2xpZW50X2lkIjoiaXQyMDdvZWF0YmQ3ZmpkY3ZzZjNybXNrdSIsInVzZXJuYW1lIjoiaWxvdmVnYWRkIn0.UfUFXgI-DYJ9kVH_yFcM1n39w9PDLP5DrXc-LK3RUeMG5hH8zIefeUZfj_neB5kLAJSyMFb5nnhs88yJ2nolZN5qLYG5r1auTW-LlMdDPU2Ga7oIMOlq7yyh42dNW0q6ubY2DPXuHDjL1FZ0pVFi0b0BJuOmw_LE6SAQfjkBOcE7--p05XnuQKshOz7uXN-WAtlNBV31v91YB0Zxiv8GMKkbrlI5kGaXtnjJ1JsF86dpUJwG4K9yo3voZYpSnSCcv-gSQjZ0PnAZ-tw9xrgCFULTzD13teqj8-kcJydTDECyJQwmABikkr7zeOvXpEBp2I_qH3_Jf_XIo5NwJEeHAA';

getUserByAccessToken(accesssToken)().then(console.log);

updateUserByAccessToken(accesssToken)().then(console.log);
