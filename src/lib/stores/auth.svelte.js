import { goto } from '$app/navigation';

const publicRoutes = ['/auth/login', '/auth/signup', '/auth/confirm'];

class AuthStore {
    isAuthenticated = $state(false);
    user = $state(null);
    loading = $state(false);
    currentPath = $state('/');

    async checkAuth() {
        if (this.loading) return;
        
        this.loading = true;
        
        try {
            const { Auth } = await import('aws-amplify');
            const user = await Auth.currentAuthenticatedUser();
            this.isAuthenticated = true;
            this.user = user;

            if (publicRoutes.includes(this.currentPath)) {
                goto('/');
            }
        } catch {
            this.isAuthenticated = false;
            this.user = null;

            if (!publicRoutes.includes(this.currentPath)) {
                goto('/auth/login');
            }
        } finally {
            this.loading = false;
        }
    }

    async login(email, password) {
        if (this.loading) return;
        
        this.loading = true;
        
        try {
            const { Auth } = await import('aws-amplify');
            const user = await Auth.signIn({
                username: String(email).trim(),
                password: String(password).trim()
            });
            
            this.isAuthenticated = true;
            this.user = user;
            goto('/');
        } catch (err) {
            throw err;
        } finally {
            this.loading = false;
        }
    }

    async logout() {
        if (this.loading) return;
        
        this.loading = true;
        
        try {
            const { Auth } = await import('aws-amplify');
            await Auth.signOut();
            this.isAuthenticated = false;
            this.user = null;
            goto('/auth/login');
        } catch (err) {
            throw err;
        } finally {
            this.loading = false;
        }
    }

    updatePath(path) {
        if (path !== this.currentPath) {
            this.currentPath = path;
        }
    }
}

export const authState = new AuthStore(); 