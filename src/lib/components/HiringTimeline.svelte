<script>
    import { STAGES, OUTCOMES, getNextStage, isLastStage, getStageClass, isDecisionStage } from '$lib/hiring-process';
    
    let { candidate } = $props();
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

            candidate = await updateResponse.json();
            updateSuccess = isDecisionStage(stageId)
                ? (outcome === OUTCOMES.HIRE ? 'Candidate hired successfully!' : 'Candidate rejected.')
                : (outcome === OUTCOMES.PASS ? 'Moved to next stage successfully!' : 'Stage updated successfully!');

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
                    <h3>{stage.name}</h3>
                    {#if stage.status === 'current'}
                        <form onsubmit={(e) => { e.preventDefault(); updateStage(stage.id, isDecisionStage(stage.id) ? OUTCOMES.HIRE : OUTCOMES.PASS); }}>
                            <div class="form-group">
                                <label for="decisionMaker">Decision Maker *</label>
                                <input 
                                    type="text" 
                                    id="decisionMaker"
                                    bind:value={decisionMaker}
                                    placeholder="Enter decision maker's name"
                                    required
                                    class="form-input"
                                />
                            </div>
                            <div class="form-group">
                                <label for="notes">Notes</label>
                                <textarea 
                                    id="notes"
                                    bind:value={notes}
                                    placeholder="Add any notes about the decision"
                                    class="form-textarea"
                                ></textarea>
                            </div>
                            <div class="stage-actions">
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
                        </form>
                    {:else}
                        <div class="stage-meta">
                            {#if stage.decisionMaker}
                                <span class="decision-maker">
                                    <i class="bi bi-person"></i>
                                    {stage.decisionMaker}
                                </span>
                            {/if}
                            {#if stage.startDate}
                                <span class="duration">
                                    <i class="bi bi-clock"></i>
                                    {getStageDuration(stage.id)}
                                </span>
                            {/if}
                        </div>
                        {#if stage.notes}
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
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
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

    .form-group label {
        display: block;
        margin-bottom: 0.25rem;
        color: #1e293b;
        font-size: 0.875rem;
        font-weight: 500;
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

    @media (max-width: 767.98px) {
        .timeline-container {
            padding: 0.5rem;
        }

        .timeline-stage {
            min-width: 180px;
            max-width: 250px;
        }

        .stage-connector {
            width: 25px;
        }

        .stage-meta {
            flex-direction: column;
            gap: 0.25rem;
        }

        .stage-actions {
            flex-direction: column;
        }

        .btn {
            width: 100%;
            justify-content: center;
        }
    }
</style> 