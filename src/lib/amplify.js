'use client';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';

// Get Cognito configuration
const cognitoConfig = {
    region: import.meta.env.VITE_COGNITO_REGION,
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    domain: import.meta.env.VITE_COGNITO_DOMAIN
};

// Validate required environment variables
const requiredEnvVars = ['VITE_COGNITO_REGION', 'VITE_COGNITO_USER_POOL_ID', 'VITE_COGNITO_CLIENT_ID', 'VITE_COGNITO_DOMAIN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const amplifyConfig = {
    Auth: {
        Cognito: {
            region: cognitoConfig.region,
            userPoolId: cognitoConfig.userPoolId,
            userPoolClientId: cognitoConfig.userPoolClientId,
            authenticationFlowType: 'USER_PASSWORD_AUTH',
            signUpVerificationMethod: 'code',
            oauth: {
                domain: cognitoConfig.domain,
                scope: ['email', 'openid', 'profile'],
                redirectSignIn: typeof window !== 'undefined' ? window.location.origin : '',
                redirectSignOut: typeof window !== 'undefined' ? window.location.origin : '',
                responseType: 'code'
            }
        }
    }
};

// Initialize Amplify only on the client side
let isConfigured = false;

export function configureAmplify() {
    if (typeof window === 'undefined' || isConfigured) return;
    
    try {
        Amplify.configure(amplifyConfig, { ssr: false });
        console.log('✅ Amplify configured successfully');
        console.log('🚀 Amplify config:', amplifyConfig);
        isConfigured = true;
    } catch (error) {
        console.error('❌ Error configuring Amplify:', error);
        throw new Error('Failed to configure Amplify. Please check your environment variables and configuration.');
    }
}

export { 
    Amplify,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    getCurrentUser
}; 