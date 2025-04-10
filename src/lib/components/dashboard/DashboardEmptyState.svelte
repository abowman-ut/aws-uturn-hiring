<script>
    // DashboardEmptyState component props
    // icon: Bootstrap icon class to display (default: 'bi-briefcase')
    // title: Title text for the empty state (default: 'No Data Available')
    // message: Message text (default: 'There is no data to display at this time.')
    // actionLabel: Text for the action button (default: 'Refresh Data')
    // showAction: Whether to show the action button (default: true)
    // actionHandler: Function to call when action button is clicked (default: empty function)
    let { 
        icon = 'bi-briefcase',
        title = 'No Data Available',
        message = 'There is no data to display at this time.',
        actionLabel = 'Refresh Data',
        showAction = true,
        actionHandler = () => {}
    } = $props();
</script>

<div class="empty-state" role="status" aria-live="polite">
    <i class="bi {icon} display-4"></i>
    <p class="mt-2">{message}</p>
    {#if showAction}
        <button 
            class="btn btn-primary mt-3"
            onclick={actionHandler}
            aria-label={actionLabel}
        >
            {actionLabel}
        </button>
    {/if}
</div>

<style>
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        text-align: center;
        color: var(--color-gray-500);
    }

    .display-4 {
        font-size: 2.5rem;
        font-weight: 300;
        line-height: 1.2;
    }

    .mt-2 {
        margin-top: 0.5rem;
    }

    .mt-3 {
        margin-top: 1rem;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .btn-primary {
        background: #4361ee;
        color: white;
        border: none;
    }

    .btn-primary:hover {
        background: #3651d4;
    }
</style> 