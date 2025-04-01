<script>
    import { base } from '$app/paths';
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';
    import { browser } from '$app/environment';
    Chart.register(...registerables);

    // Page state
    let title = 'Dashboard';
    let isLoading = $state(true);
    let positions = $state([]);
    let candidates = $state([]);
    let stats = $state({});
    
    // Chart instances
    let pipelineChart = $state(null);
    let departmentsChart = $state(null);
    let chartsInitialized = $state(false);

    // Color constants
    const COLORS = {
        primary: '#4361ee',
        success: '#2ecc71',
        warning: '#ffd43b',
        danger: '#e63946',
        info: '#0ea5e9',
        gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a'
        }
    };

    // Set document title
    $effect(() => {
        document.title = title;
    });

    // Load data
    $effect(async () => {
        if (!browser) return;
        
        try {
            console.log('Loading data...');
            const [positionsRes, candidatesRes] = await Promise.all([
                fetch('/api/positions'),
                fetch('/api/candidates')
            ]);
            
            positions = await positionsRes.json();
            candidates = await candidatesRes.json();
            
            // Calculate stats
            stats = {
                openPositions: positions.filter(p => p.state === 'open').length,
                activeInterviews: candidates.filter(c => ['CULTURE_FIT', 'INTERVIEW'].includes(c.stage)).length,
                hired: candidates.filter(c => c.stage === 'HIRED').length,
                avgDaysToHire: calculateAvgDaysToHire(candidates)
            };
            
            isLoading = false;
        } catch (error) {
            console.error('Error loading data:', error);
            isLoading = false;
        }
    });

    function calculateAvgDaysToHire(candidates) {
        const hiredCandidates = candidates.filter(c => c.stage === 'HIRED');
        if (hiredCandidates.length === 0) return 0;

        const totalDays = hiredCandidates.reduce((sum, c) => {
            const firstStage = c.stages?.[0];
            const lastStage = c.stages?.[c.stages.length - 1];
            if (!firstStage?.startDate || !lastStage?.endDate) return sum;

            const days = Math.ceil(
                (new Date(lastStage.endDate) - new Date(firstStage.startDate)) / 
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
        }, 0);

        return Math.round(totalDays / hiredCandidates.length);
    }

    // Cleanup function for charts
    function cleanupCharts() {
        console.log('Cleaning up charts...');
        try {
            if (pipelineChart) {
                pipelineChart.destroy();
                pipelineChart = null;
            }
            if (departmentsChart) {
                departmentsChart.destroy();
                departmentsChart = null;
            }
            chartsInitialized = false;
        } catch (error) {
            console.error('Error cleaning up charts:', error);
        }
    }

    // Initialize charts when DOM is ready and data is loaded
    onMount(() => {
        if (!browser) return;

        // Watch for data loading completion
        $effect(() => {
            if (!isLoading && positions.length > 0 && candidates.length > 0) {
                initializeCharts();
            }
        });

        return () => {
            cleanupCharts();
        };
    });

    // Initialize charts with error handling and logging
    async function initializeCharts() {
        if (!browser || chartsInitialized) return;
        
        console.log('Attempting to initialize charts...');
        cleanupCharts();

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const pipelineCanvas = document.getElementById('pipelineChart');
            const departmentsCanvas = document.getElementById('departmentsChart');

            if (!pipelineCanvas || !departmentsCanvas) {
                console.error('Canvas elements not found');
                return;
            }

            const pipelineCtx = pipelineCanvas.getContext('2d');
            const departmentsCtx = departmentsCanvas.getContext('2d');

            if (!pipelineCtx || !departmentsCtx) {
                console.error('Canvas contexts not available');
                return;
            }

            console.log('Creating pipeline chart...');
            pipelineChart = new Chart(pipelineCtx, {
                type: 'bar',
                data: {
                    labels: ['CV Review', 'Culture Fit', 'Interview', 'Decision'],
                    datasets: [{
                        label: 'Candidates',
                        data: [
                            candidates.filter(c => c.stage === 'CV_REVIEW').length,
                            candidates.filter(c => c.stage === 'CULTURE_FIT').length,
                            candidates.filter(c => c.stage === 'INTERVIEW').length,
                            candidates.filter(c => c.stage === 'DECISION').length
                        ],
                        backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            console.log('Creating departments chart...');
            const departmentCounts = positions.reduce((acc, pos) => {
                acc[pos.department] = (acc[pos.department] || 0) + 1;
                return acc;
            }, {});

            departmentsChart = new Chart(departmentsCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(departmentCounts),
                    datasets: [{
                        data: Object.values(departmentCounts),
                        backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            chartsInitialized = true;
            console.log('Charts initialized successfully');
        } catch (error) {
            console.error('Error initializing charts:', error);
            chartsInitialized = false;
        }
    }
</script>

{#snippet navLink(href, text)}
    <li>
        <a {href}>{text}</a>
    </li>
{/snippet}

<div class="page-container">
    {#if isLoading}
        <div class="content-card">
            <div class="skeleton-header">
                <div class="skeleton-title"></div>
                <div class="skeleton-subtitle"></div>
            </div>
            
            <div class="skeleton-stats">
                {#each Array(4) as _}
                    <div class="skeleton-stat-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-number"></div>
                            <div class="skeleton-label"></div>
                        </div>
                    </div>
                {/each}
            </div>

            <div class="skeleton-charts">
                <div class="skeleton-chart"></div>
                <div class="skeleton-chart"></div>
            </div>
        </div>
    {:else}
        <div class="content-card">
            <h1>Welcome to Uturn</h1>
            <!-- <p>Your AWS-powered hiring platform</p> -->
            
            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: {COLORS.primary}">
                        <i class="bi bi-briefcase"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">{stats.openPositions}</div>
                        <div class="stat-label">Open Positions</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: {COLORS.warning}">
                        <i class="bi bi-calendar-event"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">{stats.activeInterviews}</div>
                        <div class="stat-label">Active Interviews</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: {COLORS.success}">
                        <i class="bi bi-person-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">{stats.hired}</div>
                        <div class="stat-label">Hired</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: {COLORS.info}">
                        <i class="bi bi-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">{stats.avgDaysToHire}</div>
                        <div class="stat-label">Avg Days to Hire</div>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="charts-grid">
                <div class="chart-card">
                    <h2>Candidates Pipeline (All Departments)</h2>
                    <div class="chart-container">
                        <canvas id="pipelineChart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <h2>Positions by Department</h2>
                    <div class="chart-container">
                        <canvas id="departmentsChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Action Links -->
            <div class="action-links">

            </div>
        </div>
    {/if}
</div>

<style>
    .page-container {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    .content-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h1 {
        color: #1e293b;
        font-size: 2rem;
        font-weight: 600;
        margin: 0 0 1rem;
    }

    h2 {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0 0 1.5rem;
    }

    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
    }

    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        border-radius: 10px;
        color: white;
        font-size: 1.25rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .stat-number {
        font-size: 2rem;
        font-weight: 600;
        color: #1e293b;
        line-height: 1;
        margin-bottom: 0.5rem;
    }

    .stat-label {
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 500;
    }

    /* Charts Grid */
    .charts-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .chart-card {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        min-height: 400px;
    }

    .chart-card h2 {
        color: #334155;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 1.5rem;
        flex: none;
    }

    .chart-container {
        flex: 1;
        min-height: 300px;
        position: relative;
        width: 100%;
    }

    /* Action Links */
    .action-links {
        display: grid;
        gap: 1rem;
    }

    /* Skeleton Loading Styles */
    @keyframes shimmer {
        0% {
            background-position: -1000px 0;
        }
        100% {
            background-position: 1000px 0;
        }
    }

    .skeleton-header {
        margin-bottom: 2rem;
    }

    .skeleton-title {
        composes: skeleton;
        height: 2.5rem;
        width: 60%;
        margin-bottom: 1rem;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 4px;
    }

    .skeleton-subtitle {
        composes: skeleton;
        height: 1rem;
        width: 40%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 4px;
    }

    .skeleton-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .skeleton-stat-card {
        background: #f8fafc;
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .skeleton-icon {
        width: 3rem;
        height: 3rem;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 8px;
    }

    .skeleton-number {
        height: 2rem;
        width: 60%;
        margin-bottom: 0.5rem;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 4px;
    }

    .skeleton-label {
        height: 1rem;
        width: 80%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 4px;
    }

    .skeleton-charts {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .skeleton-chart {
        height: 300px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 8px;
    }

    @media (max-width: 1024px) {
        .charts-grid {
            grid-template-columns: 1fr;
        }

        .chart-card {
            min-height: 350px;
        }

        .chart-container {
            min-height: 250px;
        }

        .skeleton-charts {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 640px) {
        .content-card {
            padding: 1.5rem;
        }

        .stat-card {
            padding: 1rem;
        }

        .stat-icon {
            width: 2.5rem;
            height: 2.5rem;
            font-size: 1rem;
        }

        .stat-number {
            font-size: 1.5rem;
        }
    }
</style>
