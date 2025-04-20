import { signIn, signUp, signOut, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';
import { writable, derived } from 'svelte/store';

export const user = writable(null);
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
            const currentUser = await getCurrentUser();
            console.log('✅ Found authenticated user:', { currentUser });
            user.set(currentUser);
        } catch (error) {
            console.log('❌ No authenticated user found');
            user.set(null);
        }
    };

    // Initialize after a short delay to ensure Amplify is configured
    setTimeout(initializeAuth, 0);
} 