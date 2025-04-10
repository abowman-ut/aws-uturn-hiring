<script>
    import DashboardStats from './DashboardStats.svelte';
    import DashboardCharts from './DashboardCharts.svelte';
    import LoadingSkeleton from './LoadingSkeleton.svelte';
    import DashboardEmptyState from './DashboardEmptyState.svelte';
    
    // Props
    let { positions, candidates, isLoading, isEmptyData, showEmptyState, loadData } = $props();
</script>

{#if isLoading}
    <div class="content-card" role="region" aria-label="Loading dashboard content">
        <LoadingSkeleton statCards={10} charts={2} />
    </div>
{:else if showEmptyState || isEmptyData}
    <div class="content-card" role="region" aria-label="Empty dashboard state">
        <DashboardEmptyState 
            icon="bi bi-speedometer2"
            title="No Dashboard Data Available"
            message="There is no data to display at this time."
            actionLabel="Refresh Data"
            showAction={true}
            actionHandler={loadData}
            aria-live="polite"
        />
    </div>
{:else}
    <div class="content-card" role="region" aria-label="Dashboard content">
        <!-- Stats Cards -->
        <DashboardStats {positions} {candidates} />
        
        <!-- Charts -->
        <DashboardCharts {positions} {candidates} />
    </div>
{/if}

<style>
    .content-card {
        background: white;
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-md);
    }

    /* Responsive Layout */
    @media (max-width: 640px) {
        .content-card {
            padding: var(--spacing-lg);
        }
    }
</style> 