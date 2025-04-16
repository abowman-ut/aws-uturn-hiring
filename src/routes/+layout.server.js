import { redirect } from '@sveltejs/kit';

const publicRoutes = ['/auth/login', '/auth/signup', '/auth/confirm'];

export async function load({ url, cookies }) {
    // Skip auth check in development
    if (import.meta.env.DEV) {
        return {};
    }

    // Allow access to public routes
    if (publicRoutes.includes(url.pathname)) {
        return {};
    }

    // Check for authentication token
    const token = cookies.get('CognitoIdentityServiceProvider.4fgk61tprajua2jvfjh5bevu00.idToken');
    
    // Redirect to login if no token
    if (!token) {
        throw redirect(302, '/auth/login');
    }

    return {};
} 