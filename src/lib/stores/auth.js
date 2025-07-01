import { signIn, signUp, signOut, confirmSignUp, getCurrentUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { writable, derived } from 'svelte/store';
import { configureAmplify } from '../amplify';

export const user = writable(null);
export const isLoading = writable(true);
export const isAuthenticated = derived(user, ($user) => {
    console.log('Checking authentication state:', { hasUser: !!$user });
    return !!$user;
});

export async function signInUser(email, password) {
    console.log('Attempting to sign in user:', { email });
    try {
        const { isSignedIn, nextStep } = await signIn({
            username: email,
            password,
            options: {
                authFlowType: 'USER_PASSWORD_AUTH'
            }
        });
        
        console.log('Sign in response:', { isSignedIn, nextStep });
        
        if (isSignedIn) {
            const currentUser = await getCurrentUser();
            console.log('✅ Sign in successful, current user:', { currentUser });
            user.set(currentUser);
            return { isSignedIn: true, user: currentUser };
        }
        
        return { isSignedIn, nextStep };
    } catch (error) {
        console.error('❌ Sign in failed:', { error, email });
        throw error;
    }
}

export async function signUpUser(email, password) {
    console.log('Attempting to sign up user:', { email });
    try {
        const { user: authUser } = await signUp({
            username: email,
            password,
            attributes: {
                email
            }
        });
        console.log('✅ Sign up successful:', { authUser });
        return authUser;
    } catch (error) {
        console.error('❌ Sign up failed:', { error, email });
        throw error;
    }
}

export async function signOutUser() {
    console.log('Attempting to sign out user');
    try {
        await signOut();
        console.log('✅ Sign out successful');
        user.set(null);
    } catch (error) {
        console.error('❌ Sign out failed:', { error });
        throw error;
    }
}

export async function confirmSignUpUser(email, code) {
    console.log('Attempting to confirm sign up:', { email });
    try {
        await confirmSignUp({
            username: email,
            confirmationCode: code
        });
        console.log('✅ Sign up confirmation successful:', { email });
    } catch (error) {
        console.error('❌ Sign up confirmation failed:', { error, email });
        throw error;
    }
}

// Initialize auth state only on client-side
if (typeof window !== 'undefined') {
    const initializeAuth = async () => {
        console.log('Initializing auth state');
        try {
            // Ensure Amplify is configured first
            await configureAmplify();
            const currentUser = await getCurrentUser();
            const userAttributes = await fetchUserAttributes(currentUser);
            const session = await fetchAuthSession();
            const groups = session.tokens?.accessToken?.payload?.['cognito:groups'] || [];
            console.log('✅ User attributes:', { userAttributes });
            console.log('✅ Found authenticated user:', { currentUser });
            console.log('✅ User groups:', { groups });
            user.set({ ...currentUser, attributes: userAttributes, groups });
        } catch (error) {
            console.log('❌ No authenticated user found:', error);
            user.set(null);
        } finally {
            isLoading.set(false);
        }
    };
    
    // Initialize immediately and handle any errors
    initializeAuth().catch(console.error);
} 