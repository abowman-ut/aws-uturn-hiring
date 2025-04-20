<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import NavBar from "$lib/components/NavBar.svelte";
	import { browser } from '$app/environment';
	import { applyColorVariables } from '$lib/utils/colors';
    import { configureAmplify } from '$lib/amplify';
    import { isAuthenticated, user, signOutUser } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import BtnAuthSignOut from '$lib/components/BtnAuthSignOut.svelte';
    import BtnAuthSignIn from '$lib/components/BtnAuthSignIn.svelte';

	let { children } = $props();

	// Apply color variables when the app initializes
	if (browser) {
		applyColorVariables();
	}

	    // Configure Amplify on mount
		$effect(() => {
        configureAmplify();
    });

    // Effect to handle navigation after sign out
    $effect(() => {
        if (!$isAuthenticated) {
            goto('/auth');
        }
    });
</script>

<NavBar />
<div>
    {#if $isAuthenticated}
        <a href="/dashboard">Dashboard</a> |
        <BtnAuthSignOut
            onClick={signOutUser}
            showUsername={true}
            username={$user?.signInDetails?.loginId}
        />
    {:else}
        <BtnAuthSignIn
            onClick={() => goto('/auth')}
            text="Sign In"
        />
    {/if}
</div>
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