import { initializeAllCharts, cleanupCharts } from './chartUtils';

/**
 * Manages chart lifecycle including initialization, updates, and cleanup
 */
export function createChartManager() {
    // Chart state
    const chartState = {
        pipelineChart: null,
        departmentsChart: null,
        initialized: false
    };

    /**
     * Initialize charts with error handling
     * @param {Object} options - Chart initialization options
     * @param {HTMLElement} options.pipelineCanvas - Canvas element for pipeline chart
     * @param {HTMLElement} options.departmentsCanvas - Canvas element for departments chart
     * @param {Array} options.candidates - Candidate data for charts
     * @param {Array} options.positions - Position data for charts
     * @returns {Object} - Updated chart state
     */
    function initializeCharts({ pipelineCanvas, departmentsCanvas, candidates, positions }) {
        if (!pipelineCanvas || !departmentsCanvas) return chartState;
        
        // Clean up existing charts first
        cleanupCharts({ 
            pipelineChart: chartState.pipelineChart, 
            departmentsChart: chartState.departmentsChart 
        });

        try {
            const charts = initializeAllCharts({ 
                pipelineCanvas, 
                departmentsCanvas, 
                candidates, 
                positions 
            });
            
            chartState.pipelineChart = charts.pipelineChart;
            chartState.departmentsChart = charts.departmentsChart;
            chartState.initialized = true;
        } catch (error) {
            // Silent error handling
            chartState.initialized = false;
        }

        return chartState;
    }

    /**
     * Update charts with new data
     * @param {Array} candidates - Updated candidate data
     * @param {Array} positions - Updated position data
     */
    function updateCharts(candidates, positions) {
        if (!chartState.initialized) return;
        
        // Update chart data if charts are initialized
        if (chartState.pipelineChart) {
            // Update pipeline chart data
            // This would depend on the specific chart implementation
        }
        
        if (chartState.departmentsChart) {
            // Update departments chart data
            // This would depend on the specific chart implementation
        }
    }

    /**
     * Clean up charts when component is destroyed
     */
    function cleanup() {
        cleanupCharts({ 
            pipelineChart: chartState.pipelineChart, 
            departmentsChart: chartState.departmentsChart 
        });
        
        // Reset chart state
        chartState.pipelineChart = null;
        chartState.departmentsChart = null;
        chartState.initialized = false;
    }

    /**
     * Get current chart state
     * @returns {Object} - Current chart state
     */
    function getChartState() {
        return chartState;
    }

    return {
        initializeCharts,
        updateCharts,
        cleanup,
        getChartState
    };
} 