<script>
    import StatCard from './StatCard.svelte';
    import { COLORS } from '$lib/utils/colors';
    import { calculateDashboardStats, generateStatCardConfigs } from '$lib/utils/dashboardUtils';

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

    // Component props
    // positions: Array of position objects with id, title, department, and status
    // candidates: Array of candidate objects with id, name, stage, and positionId
    let { positions = [], candidates = [] } = $props();
    
    // Calculate stats using derived values
    let stats = $derived(calculateDashboardStats(positions, candidates));

    // Generate stat cards from configurations
    let statCards = $derived(generateStatCardConfigs(stats, COLORS));
</script>

<div class="stats-grid" role="list" aria-label="Dashboard statistics">
    {#each statCards as stat}
        <StatCard {...stat} />
    {/each}
</div>

<style>
    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
    }

    @media (max-width: 1400px) {
        .stats-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 768px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 640px) {
        .stats-grid {
            grid-template-columns: 1fr;
        }
    }
</style> 