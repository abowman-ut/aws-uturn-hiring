<script>
    import { base } from '$app/paths';
    let title = $state('AWS SvelteKit Test');
    let pageTitle = $derived(title);
    
    $effect(() => {
        document.title = pageTitle;
    });

    let { data } = $props();
    let dbStatusClass = $derived(data?.dbStatus?.status === 'success' ? 'success' : 'error');
</script>

<div class="page-container">
    <div class="content-card">
        <div class="header">
            <i class="bi bi-gear-fill text-primary"></i>
            <h1>{title}</h1>
        </div>
        <p class="text-muted mb-4">Welcome to the AWS SvelteKit testing environment</p>
        
        <div class="test-section">
            <div class="section-header">
                <i class="bi bi-database-fill text-primary"></i>
                <h2>DynamoDB Connection Status</h2>
            </div>
            {#if data?.dbStatus}
                <div class="status-card {dbStatusClass}">
                    <div class="status-icon">
                        <i class="bi {data.dbStatus.status === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}"></i>
                    </div>
                    <div class="status-content">
                        <h3>
                            Status: 
                            <span class="status-text">
                                {data.dbStatus.status}
                            </span>
                        </h3>
                        <p>{data.dbStatus.message}</p>
                    </div>
                </div>
            {:else}
                <div class="status-card loading">
                    <div class="status-icon">
                        <i class="bi bi-hourglass-split"></i>
                    </div>
                    <div class="status-content">
                        <p>Loading connection status...</p>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .page-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .content-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .header i {
        font-size: 1.5rem;
    }

    h1 {
        color: #1e293b;
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0;
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .section-header i {
        font-size: 1.25rem;
    }

    h2 {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0;
    }

    .test-section {
        border-top: 1px solid #e2e8f0;
        padding-top: 1.5rem;
        margin-top: 1.5rem;
    }

    .status-card {
        display: flex;
        align-items: flex-start;
        padding: 1.5rem;
        border-radius: 12px;
        margin-top: 1rem;
        transition: all 0.2s ease;
    }

    .status-card.success {
        background-color: #ecfdf5;
        border: 1px solid #6ee7b7;
    }

    .status-card.error {
        background-color: #fef2f2;
        border: 1px solid #fca5a5;
    }

    .status-card.loading {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
    }

    .status-icon {
        font-size: 1.5rem;
        margin-right: 1rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 8px;
    }

    .success .status-icon {
        color: #059669;
        background-color: #d1fae5;
    }

    .error .status-icon {
        color: #dc2626;
        background-color: #fee2e2;
    }

    .loading .status-icon {
        color: #64748b;
        background-color: #f1f5f9;
    }

    .status-content h3 {
        font-size: 1rem;
        font-weight: 500;
        margin: 0 0 0.5rem;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .status-text {
        text-transform: capitalize;
    }

    .success .status-text {
        color: #059669;
    }

    .error .status-text {
        color: #dc2626;
    }

    .status-content p {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
        line-height: 1.5;
    }

    :global(.text-primary) {
        color: #4361ee !important;
    }

    @media (max-width: 767.98px) {
        .content-card {
            padding: 1.5rem;
        }

        .status-card {
            padding: 1rem;
        }

        .status-icon {
            width: 2rem;
            height: 2rem;
            font-size: 1.25rem;
        }
    }
</style> 