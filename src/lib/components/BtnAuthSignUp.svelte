<script>
    let {
        onClick = () => {
            throw new Error('No click handler provided');
        },
        text = 'Sign Up',
        loading = false,
        loadingText = 'Signing up...'
    } = $props();
</script>

<button
    type="submit"
    class="btn btn-primary"
    onclick={onClick}
    disabled={loading}
>
    {#if loading}
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {loadingText}
    {:else}
        <i class="bi bi-person-plus me-2"></i>
        {text}
    {/if}
</button> 