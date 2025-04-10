<script>
    // ChartCard component props
    // title: Title text for the chart card
    // children: Snippet containing the chart content
    let { 
        title, 
        children 
    } = $props();
</script>

<div class="chart-card">
    <h2>{title}</h2>
    <div class="chart-container">
        {@render children()}
    </div>
</div>

<style>
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

    @media (max-width: 1400px) {
        .chart-card {
            min-height: 350px;
        }

        .chart-container {
            min-height: 250px;
        }
    }

    @media (max-width: 640px) {
        .chart-card {
            padding: 1rem;
        }
    }
</style> 