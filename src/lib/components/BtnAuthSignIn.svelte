<script>
    let {
        onClick = () => {
            throw new Error('No click handler provided');
        },
        text = 'Sign In',
        loading = false,
        loadingText = 'Signing in...',
        context = 'navbar' // 'navbar' or 'auth'
    } = $props();

    function handleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        onClick();
    }
</script>

<button 
    type={context === 'navbar' ? 'button' : 'submit'}
    class="btn {context === 'navbar' ? 'nav-link' : 'btn-primary'}"
    class:d-flex={context === 'navbar'}
    class:align-items-center={context === 'navbar'}
    class:gap-2={context === 'navbar'}
    onclick={context === 'navbar' ? onClick : handleSubmit}
    onkeydown={handleKeydown}
    disabled={loading}
>
    {#if loading}
        {#if context === 'navbar'}
            <i class="bi bi-arrow-repeat nav-icon"></i>
            <span>{loadingText}</span>
        {:else}
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            {loadingText}
        {/if}
    {:else}
        {#if context === 'navbar'}
            <i class="bi bi-box-arrow-in-right nav-icon"></i>
            <span>{text}</span>
        {:else}
            <i class="bi bi-box-arrow-in-right me-2"></i>
            {text}
        {/if}
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