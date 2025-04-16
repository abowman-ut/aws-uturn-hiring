// src/lib/amplify.js
import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
        region: 'us-east-2',
        userPoolId: 'us-east-2_1zBd5PDcY',
        userPoolWebClientId: '4fgk61tprajua2jvfjh5bevu00',
        authenticationFlowType: 'USER_PASSWORD_AUTH'
    }
});