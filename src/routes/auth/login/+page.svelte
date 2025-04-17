<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthState } from '$lib/stores/auth.svelte.js';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import AuthForm from '$lib/components/AuthForm.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoggingIn = $state(false);

	const fields = [
		{
			id: 'email',
			label: 'Email',
			type: 'email',
			value: () => email,
			setValue: (value) => email = value,
			required: true,
			autocomplete: 'email'
		},
		{
			id: 'password',
			label: 'Password',
			type: 'password',
			value: () => password,
			setValue: (value) => password = value,
			required: true,
			autocomplete: 'current-password'
		}
	];

	async function handleLogin() {
		error = '';
		isLoggingIn = true;

		try {
			const auth = getAuthState();
			await auth.login(email, password);
		} catch (err) {
			error = err.message || 'Login failed';
			if (err.code) error += ` (${err.code})`;
		} finally {
			isLoggingIn = false;
		}
	}

	onMount(async () => {
		const auth = getAuthState();
		console.log('🔍 [Login Page] auth?.isAuthenticated =', auth?.isAuthenticated);

		await new Promise((r) => setTimeout(r, 100));
		if (auth?.isAuthenticated) {
			console.log("🚪 Already logged in — redirecting to /");
			goto('/');
		}
	});
</script>

<AuthLayout title="Login">
	<AuthForm 
		fields={fields}
		submitText="Login"
		onSubmit={handleLogin}
		loading={isLoggingIn}
		error={error}
	/>

	<div class="text-center mt-3">
		<a href="/auth/signup" class="text-decoration-none">Need an account? Sign up</a>
	</div>
</AuthLayout>

<style>
	.text-center {
		margin-top: 1.5rem;
		text-align: center;
	}

	.text-center a {
		color: #0d6efd;
		text-decoration: none;
	}

	.text-center a:hover {
		text-decoration: underline;
	}
</style>
