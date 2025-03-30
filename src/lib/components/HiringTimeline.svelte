<script>
    import { STAGES, OUTCOMES, getNextStage, isLastStage, getStageClass, isDecisionStage } from '$lib/hiring-process';
    
    let { candidate, onUpdate } = $props();
    let stages = $state([]);
    let showNotes = $state(false);
    let selectedStage = $state(null);
    let isUpdating = $state(false);
    let updateError = $state(null);
    let updateSuccess = $state(null);
    let decisionMaker = $state('');
    let notes = $state('');

    // Load stages when component mounts
    $effect(() => {
        loadStages();
    });

    async function loadStages() {
        try {
            const response = await fetch('/api/candidates/stages');
            if (!response.ok) throw new Error('Failed to load stages');
            stages = await response.json();
        } catch (error) {
            console.error('Error loading stages:', error);
        }
    }

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

    function getStageNotes(stageId) {
        if (!candidate.stages) return '';
        const stage = candidate.stages.find(s => s.id === stageId);
        return stage?.notes || '';
    }

    function getStageDecisionMaker(stageId) {
        if (!candidate.stages) return '';
        const stage = candidate.stages.find(s => s.id === stageId);
        return stage?.decisionMaker || '';
    }

    function getStageDuration(stageId) {
        if (!candidate.stages) return '';
        const stage = candidate.stages.find(s => s.id === stageId);
        if (!stage?.startDate) return '';
        if (!stage?.endDate) return 'In progress';
        
        const start = new Date(stage.startDate);
        const end = new Date(stage.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return `${days} day${days !== 1 ? 's' : ''}`;
    }

    async function updateStage(stageId, outcome) {
        isUpdating = true;
        updateError = null;
        updateSuccess = null;

        try {
            console.log('Updating stage:', { stageId, outcome });
            
            const updateResponse = await fetch('/api/candidates/stages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate.id,
                    stageId,
                    decisionMaker,
                    notes,
                    outcome
                })
            });

            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error(error.error || 'Failed to update stage');
            }

            const updatedCandidate = await updateResponse.json();
            onUpdate(updatedCandidate);
            candidate = updatedCandidate;
            updateSuccess = null;

            decisionMaker = '';
            notes = '';
        } catch (error) {
            console.error('Error updating stage:', error);
            updateError = error.message;
        } finally {
            isUpdating = false;
        }
    }
</script>

<div class="timeline-container">
    {#if updateError}
        <div class="alert alert-error">
            <i class="bi bi-exclamation-circle-fill"></i>
            {updateError}
        </div>
    {/if}

    {#if updateSuccess}
        <div class="alert alert-success">
            <i class="bi bi-check-circle-fill"></i>
            {updateSuccess}
        </div>
    {/if}

    <div class="timeline">
        {#each candidate.stages as stage}
            <div class="timeline-stage {getStageClass(stage)}">
                <div class="stage-icon">
                    <i class="bi {stage.icon}"></i>
                </div>
                <div class="stage-content">
                    {#if stage.status === 'current'}
                        <h3>{stage.name}</h3>
                        <form onsubmit={(e) => { e.preventDefault(); updateStage(stage.id, isDecisionStage(stage.id) ? OUTCOMES.HIRE : OUTCOMES.PASS); }}>
                            <div class="form-group">
                                <div class="input-with-icon">
                                    <input 
                                        type="text" 
                                        id="decisionMaker"
                                        bind:value={decisionMaker}
                                        placeholder="Decision maker"
                                        required
                                        class="form-input"
                                    />
                                    <button 
                                        type="button" 
                                        class="icon-button" 
                                        onclick={() => showNotes = !showNotes}
                                        title="Toggle notes"
                                        aria-label="Toggle notes"
                                    >
                                        <i class="bi bi-journal-text"></i>
                                    </button>
                                </div>
                                {#if showNotes}
                                    <textarea
                                        bind:value={notes}
                                        placeholder="Add notes..."
                                        class="form-textarea mt-2"
                                    ></textarea>
                                {/if}
                            </div>
                            <div class="stage-actions">
                                <div class="button-container">
                                    <button 
                                        type="submit" 
                                        class="btn btn-success"
                                        disabled={isUpdating || !decisionMaker}
                                    >
                                        <i class="bi bi-check-circle"></i>
                                        {isDecisionStage(stage.id) ? 'Hire' : 'Pass'}
                                    </button>
                                    <button 
                                        type="button" 
                                        class="btn btn-danger"
                                        onclick={() => updateStage(stage.id, OUTCOMES.REJECT)}
                                        disabled={isUpdating || !decisionMaker}
                                    >
                                        <i class="bi bi-x-circle"></i>
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </form>
                    {:else}
                        <div class="stage-header">
                            <h3>{stage.name}</h3>
                            {#if stage.notes}
                                <button 
                                    type="button" 
                                    class="icon-button" 
                                    onclick={() => selectedStage = selectedStage === stage.id ? null : stage.id}
                                    title="Toggle notes"
                                    aria-label="Toggle notes"
                                >
                                    <i class="bi bi-journal-text"></i>
                                </button>
                            {/if}
                        </div>
                        <div class="stage-meta">
                            {#if stage.decisionMaker}
                                <span class="decision-maker">
                                    <i class="bi bi-person"></i>
                                    {stage.decisionMaker}
                                </span>
                                <span class="date-time">
                                    <i class="bi bi-clock"></i>
                                    {new Date(stage.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {#if getStageDuration(stage.id) !== ''}
                                        ({getStageDuration(stage.id)})
                                    {/if}
                                </span>
                            {/if}
                        </div>
                        {#if stage.notes && selectedStage === stage.id}
                            <p class="notes">{stage.notes}</p>
                        {/if}
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .timeline-container {
        padding: 1rem;
        overflow-x: auto;
    }

    .timeline {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        position: relative;
        min-width: min-content;
    }

    .timeline-stage {
        display: flex;
        align-items: flex-start;
        position: relative;
        padding: 1rem;
        background: white;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
        min-width: 200px;
        max-width: 300px;
    }

    .timeline-stage:hover {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .timeline-stage.current {
        border-color: #4361ee;
        background: #eff6ff;
    }

    .timeline-stage.completed {
        border-color: #059669;
        background: #ecfdf5;
    }

    .timeline-stage.completed.reject {
        border-color: #dc2626;
        background: #fef2f2;
    }

    .timeline-stage.pending {
        opacity: 0.7;
    }

    .stage-icon {
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 50%;
        border: 2px solid #e2e8f0;
        margin-right: 0.75rem;
    }

    .timeline-stage.current .stage-icon {
        border-color: #4361ee;
        color: #4361ee;
    }

    .timeline-stage.completed .stage-icon {
        border-color: #059669;
        color: #059669;
    }

    .timeline-stage.completed.reject .stage-icon {
        border-color: #dc2626;
        color: #dc2626;
    }

    .stage-content {
        flex: 1;
    }

    .stage-content h3 {
        margin: 0;
        color: #1e293b;
        font-size: 1rem;
        font-weight: 600;
    }

    .stage-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-top: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
    }

    .stage-meta span {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .notes {
        margin: 0.5rem 0 0;
        color: #64748b;
        font-size: 0.875rem;
    }

    .stage-actions {
        margin-top: 0.75rem;
        width: 100%;
    }

    .button-container {
        display: flex;
        gap: 0.5rem;
        width: 100%;
    }

    .button-container .btn {
        flex: 1;
        justify-content: center;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
    }

    .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .btn-success {
        background: #059669;
        color: white;
        border: none;
    }

    .btn-success:hover:not(:disabled) {
        background: #047857;
    }

    .btn-danger {
        background: #dc2626;
        color: white;
        border: none;
    }

    .btn-danger:hover:not(:disabled) {
        background: #b91c1c;
    }

    .alert {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }

    .alert-error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
    }

    .alert-success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
    }

    .form-group {
        margin-bottom: 0.75rem;
    }

    .form-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
    }

    .form-textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        min-height: 80px;
        resize: vertical;
    }

    .input-with-icon {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .icon-button {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease;
    }

    .icon-button:hover {
        color: #1e293b;
    }

    .mt-2 {
        margin-top: 0.5rem;
    }

    .stage-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .stage-header h3 {
        margin: 0;
    }

    .stage-header .icon-button {
        padding: 0.25rem;
    }

    @media (max-width: 767.98px) {
        .timeline-container {
            padding: 0.5rem;
        }

        .timeline {
            flex-direction: column;
            gap: 1rem;
        }

        .timeline-stage {
            min-width: 100%;
            max-width: 100%;
        }

        .stage-connector {
            width: 25px;
        }

        .stage-meta {
            flex-direction: column;
            gap: 0.25rem;
        }

        .stage-actions {
            flex-direction: row;
            justify-content: space-between;
        }

        .btn {
            flex: 1;
            justify-content: center;
        }
    }
</style> 