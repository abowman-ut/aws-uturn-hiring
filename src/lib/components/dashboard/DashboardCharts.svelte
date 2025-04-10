<script>
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import ChartCard from './ChartCard.svelte';
    import { initializeAllCharts, cleanupCharts } from '$lib/utils/chartUtils';

    /**
     * @typedef {Object} Position
     * @property {string} id - Position ID
     * @property {string} title - Position title
     * @property {string} department - Department name
     * @property {string} status - Position status
     */

    /**
     * @typedef {Object} Candidate
     * @property {string} id - Candidate ID
     * @property {string} name - Candidate name
     * @property {string} stage - Interview stage
     * @property {string} positionId - Associated position ID
     */

    /**
     * Component props
     * @param {Position[]} positions - List of positions
     * @param {Candidate[]} candidates - List of candidates
     */
    let { positions = [], candidates = [] } = $props();
    
    // Chart instances
    let pipelineChart = $state(null);
    let departmentsChart = $state(null);
    let chartsInitialized = $state(false);

    // Initialize charts when DOM is ready and data is loaded
    onMount(() => {
        if (!browser) return;

        // Watch for data loading completion
        $effect(() => {
            if (positions.length > 0 && candidates.length > 0) {
                initializeCharts();
            }
        });
    });

    // Cleanup on component destroy
    onDestroy(() => {
        cleanupCharts({ pipelineChart, departmentsChart });
    });

    // Initialize charts with error handling
    async function initializeCharts() {
        if (!browser || chartsInitialized) return;
        
        cleanupCharts({ pipelineChart, departmentsChart });

        try {
            const pipelineCanvas = document.getElementById('pipelineChart');
            const departmentsCanvas = document.getElementById('departmentsChart');

            const charts = initializeAllCharts({ 
                pipelineCanvas, 
                departmentsCanvas, 
                candidates, 
                positions 
            });
            
            pipelineChart = charts.pipelineChart;
            departmentsChart = charts.departmentsChart;
            chartsInitialized = true;
        } catch (error) {
            // Silent error handling - no console logs
            chartsInitialized = false;
        }
    }
</script>

<div class="charts-grid">
    <ChartCard title="Interview Stages: All Departments">
        {@render pipelineChartContent()}
    </ChartCard>

    <ChartCard title="Positions by Department">
        {@render departmentsChartContent()}
    </ChartCard>
</div>

{#snippet pipelineChartContent()}
    <canvas id="pipelineChart" aria-label="Candidates Pipeline Chart"></canvas>
{/snippet}

{#snippet departmentsChartContent()}
    <canvas id="departmentsChart" aria-label="Positions by Department Chart"></canvas>
{/snippet}

<style>
    /* Charts Grid */
    .charts-grid {
        display: none;
    }

    @media (min-width: 992px) {
        .charts-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
        }
    }

    @media (max-width: 1400px) {
        .charts-grid {
            grid-template-columns: 1fr;
        }
    }
</style> 