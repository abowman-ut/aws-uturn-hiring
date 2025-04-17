import { goto } from '$app/navigation';

const publicRoutes = ['/auth/login', '/auth/signup', '/auth/confirm'];

class AuthStore {
	isAuthenticated = $state(false);
	user = $state(null);
	loading = $state(false);
	currentPath = $state('/');

	async checkAuth() {
		console.log('🟠 [Auth] Loading:', this.loading);
		if (this.loading) return;

		this.loading = true;
		console.log('🔍 Checking auth...');

		try {
			const { Auth } = await import('aws-amplify');
			const user = await Auth.currentAuthenticatedUser();
			this.isAuthenticated = true;
			this.user = user;

			console.log('✅ User is authenticated:', user);
			console.log('📍 Current path:', this.currentPath);

			if (publicRoutes.includes(this.currentPath)) {
				console.log('🚀 Redirecting to /');
				goto('/', { replaceState: true });
			}
		} catch {
			this.isAuthenticated = false;
			this.user = null;

			if (!publicRoutes.includes(this.currentPath)) {
				console.log('🔐 Not authenticated — redirecting to login');
				goto('/auth/login');
			}
		} finally {
			this.loading = false;
			console.log('🟢 [Auth] Done loading:', this.loading);
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
		} catch (err) {
			throw err;
		} finally {
			this.loading = false;
			await this.checkAuth();
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

// ✅ SSR-safe dynamic singleton
let instance = $state(null);

export function getAuthState() {
	if (typeof window === 'undefined') return null;

	if (!instance) {
		instance = new AuthStore();
	}
	return instance;
}
