<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import NavBar from "$lib/components/NavBar.svelte";
	import { browser } from '$app/environment';
	import { applyColorVariables } from '$lib/utils/colors';

	let { children } = $props();

	// Apply color variables when the app initializes
	if (browser) {
		applyColorVariables();
	}
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