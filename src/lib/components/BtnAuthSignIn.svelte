<script>
    let {
        onClick = () => {
            throw new Error('No click handler provided');
        },
        text = 'Sign In',
        loading = false,
        loadingText = 'Signing in...'
    } = $props();
</script>

<button
    type="submit"
    onclick={onClick}
    disabled={loading}
>
    {#if loading}
        {loadingText}
    {:else}
        {text}
    {/if}
</button> 