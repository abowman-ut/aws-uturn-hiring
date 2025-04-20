<script>
    import { user } from '$lib/stores/auth';
    import { onMount } from 'svelte';

    onMount(() => {
        console.log('Current user object:', $user);
    });
</script>

<div>
    <h3>Dashboard</h3>
    <h4>Welcome {$user?.signInDetails?.loginId || 'no value: User'}!</h4>

    <h4>Raw User Object</h4>
    <pre>{JSON.stringify($user, null, 2)}</pre>
</div> 