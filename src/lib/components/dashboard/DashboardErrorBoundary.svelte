<script>
    // DashboardErrorBoundary component props
    // error: Error message to display (default: null)
    // retryAction: Function to call when retry button is clicked (default: null)
    let { error = null, retryAction = null } = $props();
</script>

{#if error}
    <div class="error-wrapper" role="alert" aria-live="assertive">
        <div class="error-container">
            <i class="bi bi-exclamation-circle-fill me-2" aria-hidden="true"></i>
            <span>{error}</span>
            {#if retryAction}
                <button 
                    class="close-button" 
                    onclick={retryAction}
                    aria-label="Retry loading data"
                >×</button>
            {/if}
        </div>
    </div>
{/if}

<style>
    .error-wrapper {
        display: flex;
        justify-content: center;
        width: 100%;
    }

    .error-container {
        display: flex;
        align-items: center;
        padding: 1rem 1.25rem;
        background-color: #fee2e2;
        border: 1px solid #fca5a5;
        border-radius: 0.375rem;
        color: #991b1b;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        position: relative;
        width: 50%;
    }

    .bi-exclamation-circle-fill {
        color: #dc2626;
        font-size: 1.25rem;
    }

    .me-2 {
        margin-right: 0.75rem;
    }

    .close-button {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #991b1b;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.5;
        transition: opacity 0.2s;
    }

    .close-button:hover {
        opacity: 1;
    }
</style> 