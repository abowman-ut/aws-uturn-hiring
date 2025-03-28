<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import NavBar from "$lib/components/NavBar.svelte";

	let { children } = $props();
</script>

<NavBar />
<div class="container-fluid px-5 my-5">
	{@render children()}
</div>

<style>
</style>