const AWS = require('aws-sdk');

const CUSTOM_ATTRIBUTE_NAME = 'pecorinoAccountIds';

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    apiVersion: 'latest',
    region: 'ap-northeast-1',
    credentials: new AWS.Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })
});

addPecorinoAccountId('ilovegadd', 'test');

async function addPecorinoAccountId(username, accountId) {
    const accountIds = await new Promise((resolve, reject) => {
        cognitoIdentityServiceProvider.adminGetUser(
            {
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username
            },
            (err, data) => {
                if (err instanceof Error) {
                    reject(err);
                } else {
                    if (data.UserAttributes === undefined) {
                        reject(new Error('UserAttributes not found.'));
                    } else {
                        const attribute = data.UserAttributes.find((a) => a.Name === `custom:${CUSTOM_ATTRIBUTE_NAME}`);
                        resolve((attribute !== undefined) ? JSON.parse(attribute.Value) : []);
                    }
                }
            });
    });
    console.log('accountIds:', accountIds);

    accountIds.push(accountId);

    await new Promise((resolve, reject) => {
        cognitoIdentityServiceProvider.adminUpdateUserAttributes(
            {
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username,
                UserAttributes: [
                    {
                        Name: `custom:${CUSTOM_ATTRIBUTE_NAME}`,
                        Value: JSON.stringify(accountIds)
                    }
                ]
            },
            (err) => {
                if (err instanceof Error) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
    console.log('account added.', accountIds);

    await new Promise((resolve, reject) => {
        cognitoIdentityServiceProvider.adminDeleteUserAttributes(
            {
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username,
                UserAttributeNames: [
                    `custom:${CUSTOM_ATTRIBUTE_NAME}`
                ]
            },
            (err) => {
                if (err instanceof Error) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
    console.log('account deleted.');
}