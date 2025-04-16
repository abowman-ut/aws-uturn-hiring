<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import NavBar from "$lib/components/NavBar.svelte";
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { applyColorVariables } from '$lib/utils/colors';
	import { authState } from '$lib/stores/auth.svelte.js';
	import { page } from '$app/state';
	// import '$lib/amplify';

	let { children } = $props();
	let currentPage = $state(page);

	// Initialize auth state on mount
	if (browser) {
		console.log('Initializing layout...');
		applyColorVariables();
		authState.checkAuth();
	}

	// Watch for path changes
	$effect(() => {
		if (browser) {
			console.log('Path changed:', currentPage.url.pathname);
			authState.updatePath(currentPage.url.pathname);
		}
	});
	
	onMount(async () => {
		const { configureAmplify } = await import('$lib/amplify-client.js');
		await configureAmplify();

		const { Auth } = await import('aws-amplify');
		try {
			const user = await Auth.currentAuthenticatedUser();
			console.log("✅ Authenticated:", user);
		} catch (err) {
			console.error("🔥 Auth error:", err);
		}
	});
</script>

{#if !authState.loading || ['/auth/login', '/auth/signup', '/auth/confirm'].includes(currentPage.url.pathname)}
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

<style>
	:global(body) {
		background-color: #f8fafc !important;
		color: #334155;
	}

	.main-content {
		min-height: calc(100vh - 56px);
		padding: 0.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	@media (max-width: 767.98px) {
		.main-content {
			padding: 1rem;
		}
	}
</style>