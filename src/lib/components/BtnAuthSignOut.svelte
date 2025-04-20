<script>
    let {
        onClick = () => {
            throw new Error('No click handler provided');
        },
        text = 'Sign Out',
        loading = false,
        loadingText = 'Signing out...',
        showUsername = false,
        username = ''
    } = $props();
</script>

<button
    type="button"
    onclick={onClick}
    disabled={loading}
>
    {#if loading}
        {loadingText}
    {:else}
        {#if showUsername && username}
            {text}: {username}
        {:else}
            {text}
        {/if}
    {/if}
</button> 