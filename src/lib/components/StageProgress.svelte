<script>
    import { STAGES } from '$lib/hiring-process';
    
    let { candidate } = $props();

    function getStageStatus(stageId) {
        if (!candidate.stages) return 'pending';
        const stage = candidate.stages.find(s => s.id === stageId);
        return stage?.status || 'pending';
    }

    function getStageOutcome(stageId) {
        if (!candidate.stages) return null;
        const stage = candidate.stages.find(s => s.id === stageId);
        return stage?.outcome;
    }

    function getStageClass(stage) {
        const status = getStageStatus(stage.id);
        const outcome = getStageOutcome(stage.id);

        if (status === 'completed') {
            return outcome === 'reject' ? 'completed reject' : 'completed';
        }

        if (status === 'current') {
            return 'current';
        }

        return 'pending';
    }
</script>

<div class="stage-progress">
    {#each STAGES as stage, index}
        <div class="stage {getStageClass(stage)}">
            {#if getStageOutcome(stage.id) === 'reject'}
                <i class="bi bi-x-circle"></i>
            {:else}
                <i class="bi {stage.icon}"></i>
            {/if}
            {#if index < STAGES.length - 1 && getStageOutcome(stage.id) !== 'reject'}
                <div class="connector"></div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .stage-progress {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        padding: 0.5rem 0;
        position: relative;
    }

    .stage {
        position: relative;
        width: 1.75rem;
        height: 1.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: white;
        border: 2px solid #e2e8f0;
        color: #64748b;
        transition: all 0.2s ease;
        font-size: 0.875rem;
    }

    .stage.current {
        border-color: #4361ee;
        color: #4361ee;
        background: #eff6ff;
    }

    .stage.completed {
        border-color: #059669;
        color: #059669;
        background: #ecfdf5;
    }

    .stage.completed.reject {
        border-color: #dc2626;
        color: #dc2626;
        background: #fef2f2;
    }

    .stage.pending {
        opacity: 0.7;
    }

    .connector {
        position: absolute;
        right: -0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1rem;
        height: 2px;
        background: #e2e8f0;
    }

    .stage.completed .connector {
        background: #059669;
    }

    .stage.completed.reject .connector {
        background: #dc2626;
    }
</style> 