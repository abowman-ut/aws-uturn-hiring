<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import NavBar from "$lib/components/NavBar.svelte";
	import { browser } from '$app/environment';
	import { applyColorVariables } from '$lib/utils/colors';
    import { isAuthenticated, user, signOutUser, isLoading } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import BtnAuthSignOut from '$lib/components/BtnAuthSignOut.svelte';
    import BtnAuthSignIn from '$lib/components/BtnAuthSignIn.svelte';

	let { children } = $props();

	// Apply color variables when the app initializes
	if (browser) {
		applyColorVariables();
	}

    // Effect to handle navigation based on auth state
    $effect(() => {
        if (browser && !$isLoading) {
            if (!$isAuthenticated && $page.url.pathname !== '/auth') {
                goto('/auth');
            } else if ($isAuthenticated && $page.url.pathname === '/auth') {
                goto('/');
            }
        }
    });
</script>

<NavBar />
<main class="main-content">
	{@render children()}
</main>

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