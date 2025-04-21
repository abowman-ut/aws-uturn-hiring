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

    function handleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    }
</script>

<button 
    type="button"
    class="nav-link d-flex align-items-center gap-2"
    onclick={onClick}
    onkeydown={handleKeydown}
    disabled={loading}
>
    {#if loading}
        <i class="bi bi-arrow-repeat nav-icon"></i>
        <span>{loadingText}</span>
    {:else}
        <i class="bi bi-box-arrow-right nav-icon"></i>
        <span>
            {#if showUsername && username}
                {username}
            {:else}
                {text}
            {/if}
        </span>
    {/if}
</button>

<style>
    .nav-link {
        color: rgba(255, 255, 255, 0.85);
        padding: 0.5rem 1rem;
        font-size: 0.9375rem;
        transition: all 0.2s ease;
        cursor: pointer;
        background: none;
        border: none;
        text-decoration: none;
    }

    .nav-icon {
        font-size: 1rem;
        opacity: 0.75;
    }

    .nav-link:hover {
        color: white;
        text-decoration: none;
    }

    .nav-link:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style> 