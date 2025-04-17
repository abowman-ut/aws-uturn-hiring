let isConfigured = false;

export async function configureAmplify() {
	if (isConfigured || typeof window === 'undefined') return;

	const { Amplify } = await import('aws-amplify');
	Amplify.configure({
		Auth: {
			region: import.meta.env.VITE_COGNITO_REGION,
			userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
			userPoolWebClientId: import.meta.env.VITE_COGNITO_USER_POOL_WEB_CLIENT_ID,
			authenticationFlowType: 'USER_PASSWORD_AUTH'
		}
	});
	isConfigured = true;
}

  