import { Chart } from 'chart.js';
import { COLORS, CHART_COLORS } from './colors';
import { getCandidatesInStage } from './candidateUtils';

/**
 * Initialize the pipeline chart
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} candidates - List of candidate objects
 * @returns {Chart} - Chart instance
 */
export function initializePipelineChart(ctx, candidates) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['CV Review', 'Culture Fit', 'Interview', 'Decision'],
            datasets: [{
                label: 'Candidates',
                data: [
                    getCandidatesInStage(candidates, 'cv_review'),
                    getCandidatesInStage(candidates, 'culture_fit'),
                    getCandidatesInStage(candidates, 'interview'),
                    getCandidatesInStage(candidates, 'decision')
                ],
                backgroundColor: COLORS.warning
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            aria: {
                label: 'Candidates Pipeline Chart'
            }
        }
    });
}

/**
 * Initialize the departments chart
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} positions - List of position objects
 * @returns {Chart} - Chart instance
 */
export function initializeDepartmentsChart(ctx, positions) {
    // Create departments chart
    const departmentCounts = positions.reduce((acc, pos) => {
        acc[pos.department] = (acc[pos.department] || 0) + 1;
        return acc;
    }, {});

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(departmentCounts),
            datasets: [{
                data: Object.values(departmentCounts),
                backgroundColor: CHART_COLORS
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.25,
            cutout: '50%',
            aria: {
                label: 'Positions by Department Chart'
            }
        }
    });
}

/**
 * Initializes all dashboard charts
 * @param {Object} params
 * @param {HTMLCanvasElement} params.pipelineCanvas - Canvas for pipeline chart
 * @param {HTMLCanvasElement} params.departmentsCanvas - Canvas for departments chart
 * @param {Array} params.candidates - Candidate data
 * @param {Array} params.positions - Position data
 * @returns {Object} Chart instances
 */
export function initializeAllCharts({ pipelineCanvas, departmentsCanvas, candidates, positions }) {
    if (!pipelineCanvas || !departmentsCanvas) {
        return { pipelineChart: null, departmentsChart: null };
    }

    const pipelineCtx = pipelineCanvas.getContext('2d');
    const departmentsCtx = departmentsCanvas.getContext('2d');

    if (!pipelineCtx || !departmentsCtx) {
        return { pipelineChart: null, departmentsChart: null };
    }

    // Create charts using utility functions
    const pipelineChart = initializePipelineChart(pipelineCtx, candidates);
    const departmentsChart = initializeDepartmentsChart(departmentsCtx, positions);

    return { pipelineChart, departmentsChart };
}

/**
 * Clean up chart instances
 * @param {Object} charts - Object containing chart instances
 */
export function cleanupCharts(charts) {
    try {
        if (charts.pipelineChart) {
            charts.pipelineChart.destroy();
            charts.pipelineChart = null;
        }
        if (charts.departmentsChart) {
            charts.departmentsChart.destroy();
            charts.departmentsChart = null;
        }
    } catch (error) {
        // Silent error handling
    }
} 