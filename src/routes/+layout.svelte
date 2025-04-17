<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { applyColorVariables } from '$lib/utils/colors';
	import { getAuthState } from '$lib/stores/auth.svelte.js';
	import { page } from '$app/state';
	import NavBar from '$lib/components/NavBar.svelte';

	let { children } = $props();
	let currentPage = $state(page);

	let authState = $state(null);
	let publicRoutes = ['/auth/login', '/auth/signup', '/auth/confirm'];
	let currentPath = $state('');

	onMount(async () => {
		if (!browser) return;

		console.log('🟡 Initializing layout...');
		applyColorVariables();

		const { configureAmplify } = await import('$lib/amplify-client.js');
		await configureAmplify();
		console.log('🟢 Amplify configured');

		authState = getAuthState();
		await authState?.checkAuth();
	});

	$effect(() => {
		if (browser) {
			currentPath = currentPage.url.pathname;
			authState?.updatePath(currentPath);
			console.log('Path changed:', currentPath);
		}
	});
</script>

{#if authState && (!authState.loading || publicRoutes.includes(currentPath))}
	<NavBar />
	<main class="main-content">
		{@render children()}
	</main>
{:else}
	<div class="d-flex justify-content-center align-items-center" style="height: 100vh;">
		<div class="spinner-border text-primary" role="status">
			<span class="visually-hidden">Loading...</span>
		</div>
	</div>
{/if}
