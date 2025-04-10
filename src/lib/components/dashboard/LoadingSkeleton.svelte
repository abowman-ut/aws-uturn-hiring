<script>
    // Props
    let { 
        title = false,
        subtitle = false,
        statCards = 10,
        charts = 2
    } = $props();
</script>

{#if title || subtitle}
    <div class="skeleton-header">
        {#if title}
            <div class="skeleton-title"></div>
        {/if}
        {#if subtitle}
            <div class="skeleton-subtitle"></div>
        {/if}
    </div>
{/if}

<div class="skeleton-stats">
    {#each Array(statCards) as _}
        <div class="skeleton-stat-card">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
                <div class="skeleton-number"></div>
                <div class="skeleton-label"></div>
            </div>
        </div>
    {/each}
</div>

{#if charts > 0}
    <div class="skeleton-charts">
        <div class="skeleton-chart-container">
            <div class="skeleton-chart skeleton-chart-large"></div>
        </div>
        <div class="skeleton-chart-container skeleton-chart-container-small">
            <div class="skeleton-chart skeleton-chart-small"></div>
        </div>
    </div>
{/if}

<style>
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
        height: 2.5rem;
        width: 60%;
        margin-bottom: 1rem;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 4px;
    }

    .skeleton-subtitle {
        height: 1rem;
        width: 40%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 4px;
    }

    .skeleton-stats {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .skeleton-stat-card {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        border: 1px solid #e2e8f0;
    }

    .skeleton-icon {
        width: 4rem;
        height: 4rem;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 12px;
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

    .skeleton-chart-container {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        min-height: 400px;
    }

    .skeleton-chart-container-small {
        min-height: 200px;
    }

    .skeleton-chart {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        border-radius: 12px;
        flex: 1;
    }

    .skeleton-chart-large {
        min-height: 300px;
    }

    .skeleton-chart-small {
        min-height: 200px;
        max-width: 300px;
        margin: 0 auto;
        width: 100%;
    }

    @media (max-width: 1400px) {
        .skeleton-charts {
            grid-template-columns: 1fr;
        }

        .skeleton-stats {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 768px) {
        .skeleton-stats {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 640px) {
        .skeleton-stats {
            grid-template-columns: 1fr;
        }

        .skeleton-stat-card {
            padding: 1rem;
        }

        .skeleton-icon {
            width: 2.5rem;
            height: 2.5rem;
        }

        .skeleton-number {
            font-size: 1.5rem;
        }
    }
</style> 