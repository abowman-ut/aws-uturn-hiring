<script>
    import { base } from '$app/paths';
    import { browser } from '$app/environment';
    import LoadingSkeleton from '$lib/components/dashboard/LoadingSkeleton.svelte';
    import DashboardEmptyState from '$lib/components/dashboard/DashboardEmptyState.svelte';
    import DashboardErrorBoundary from '$lib/components/dashboard/DashboardErrorBoundary.svelte';
    import StateButtons from '$lib/components/StateButtons.svelte';
    import DashboardStats from '$lib/components/dashboard/DashboardStats.svelte';
    import DashboardCharts from '$lib/components/dashboard/DashboardCharts.svelte';
    import { Chart, registerables } from 'chart.js';
    import { calculateDashboardStats } from '$lib/utils/dashboardUtils';
    import { createChartManager } from '$lib/utils/chartManager';
    import { fetchDashboardData } from '$lib/utils/dataUtils';
    Chart.register(...registerables);

    // Data structure for job positions
    // Each position has an ID, title, department, and status
    // Used to display and manage job openings in the dashboard

    // Data structure for candidates
    // Each candidate has an ID, name, interview stage, and associated position ID
    // Used to track applicants through the hiring process

    // Page title
    let title = 'Dashboard';
    
    // Consolidated UI state
    let uiState = $state({
        isLoading: true,
        showEmptyState: false,
        error: null
    });
    
    // Consolidated data state
    let dataState = $state({
        positions: [],
        candidates: []
    });
    
    // Create chart manager
    const chartManager = createChartManager();

    // Set document title
    $effect(() => {
        document.title = title;
    });

    // Calculate stats using derived values
    let stats = $derived(calculateDashboardStats(dataState.positions, dataState.candidates));
    
    // Derived value for empty data state
    let isEmptyData = $derived(dataState.positions.length === 0 && dataState.candidates.length === 0);

    // Load data function
    async function loadData() {
        if (!browser) return;
        
        try {
            uiState.isLoading = true;
            uiState.error = null;
            
            const data = await fetchDashboardData();
            dataState.positions = data.positions;
            dataState.candidates = data.candidates;
            
            uiState.isLoading = false;
        } catch (err) {
            uiState.error = err.message;
            uiState.isLoading = false;
        }
    }

    // Initial data load
    $effect(() => {
        loadData();
    });

    // Initialize charts when DOM is ready and data is loaded
    $effect(() => {
        if (!uiState.isLoading && !isEmptyData) {
            initializeCharts();
        }
    });

    // Cleanup on component destroy
    $effect(() => {
        chartManager.cleanup();
    });

    // Initialize charts with error handling
    async function initializeCharts() {
        if (!browser) return;
        
        const pipelineCanvas = document.getElementById('pipelineChart');
        const departmentsCanvas = document.getElementById('departmentsChart');

        chartManager.initializeCharts({ 
            pipelineCanvas, 
            departmentsCanvas, 
            candidates: dataState.candidates, 
            positions: dataState.positions 
        });
    }

    // Consolidated toggle handler function
    function handleToggleState(stateType) {
        // Reset other states when toggling one state
        if (stateType === 'loading') {
            uiState.isLoading = !uiState.isLoading;
            if (uiState.showEmptyState) uiState.showEmptyState = false;
            if (uiState.error) uiState.error = null;
        } else if (stateType === 'empty') {
            uiState.showEmptyState = !uiState.showEmptyState;
            if (uiState.isLoading) uiState.isLoading = false;
            if (uiState.error) uiState.error = null;
        } else if (stateType === 'error') {
            if (uiState.error) {
                uiState.error = null;
            } else {
                uiState.error = 'This is a sample error message to demonstrate the error boundary component.';
            }
            if (uiState.isLoading) uiState.isLoading = false;
            if (uiState.showEmptyState) uiState.showEmptyState = false;
        }
    }
</script>

<div class="page-container" role="main" aria-label="Dashboard">
    <StateButtons 
        isLoading={uiState.isLoading}
        showEmptyState={uiState.showEmptyState}
        error={uiState.error}
        onToggleLoading={() => handleToggleState('loading')}
        onToggleEmptyState={() => handleToggleState('empty')}
        onToggleError={() => handleToggleState('error')}
    />
    
    {#if uiState.error}
        <DashboardErrorBoundary error={uiState.error} retryAction={loadData} aria-live="assertive" />
    {:else if uiState.isLoading}
        <div class="content-card" role="region" aria-label="Loading dashboard content">
            <LoadingSkeleton statCards={10} charts={2} />
        </div>
    {:else if uiState.showEmptyState || isEmptyData}
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
            <DashboardStats positions={dataState.positions} candidates={dataState.candidates} />
            
            <!-- Charts -->
            <DashboardCharts positions={dataState.positions} candidates={dataState.candidates} />
        </div>
    {/if}
</div>

<style>
    /* Layout */
    .page-container {
        max-width: 1400px;
        margin: var(--spacing-xl) auto;
        padding: 0 var(--spacing-md);
    }

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


