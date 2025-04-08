<script>
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';

    // Props
    let { feature, projectId } = $props();
    
    // State
    let ragStatus = $state(null);
    let ragStatusComments = $state(null);
    let loadingRagStatus = $state(false);
    let ragStatusError = $state(null);
    let droppedStories = $state([]);
    let isDraggingOver = $state(false);
    let draggedStoryId = $state(null);
    
    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Get status badge class based on state
    function getStatusBadgeClass(state) {
        const stateLower = state.toLowerCase();
        if (stateLower.includes('done') || stateLower.includes('completed')) {
            return 'bg-success';
        } else if (stateLower.includes('in progress') || stateLower.includes('active')) {
            return 'bg-primary';
        } else if (stateLower.includes('blocked') || stateLower.includes('blocked')) {
            return 'bg-danger';
        } else {
            return 'bg-secondary';
        }
    }
    
    // Get RAG status badge class
    function getRAGStatusBadgeClass(status) {
        if (!status || status === 'Not Set') return 'bg-secondary';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('red')) {
            return 'bg-danger';
        } else if (statusLower.includes('amber') || statusLower.includes('yellow')) {
            return 'bg-warning text-dark';
        } else if (statusLower.includes('green')) {
            return 'bg-success';
        } else {
            return 'bg-secondary';
        }
    }
    
    // Fetch RAG Status fields
    async function fetchRagStatus() {
        if (!projectId || !feature.id) return;
        
        loadingRagStatus = true;
        ragStatusError = null;
        
        try {
            const response = await fetch(`/api/ado/rag-status?projectId=${projectId}&featureId=${feature.id}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load RAG Status');
            }
            
            const data = await response.json();
            
            // Update state with RAG Status fields
            ragStatus = data.data['Custom.RAGStatus'] || null;
            ragStatusComments = data.data['Custom.RAGStatusComments'] || null;
        } catch (err) {
            console.error('Error loading RAG Status:', err);
            ragStatusError = err.message;
        } finally {
            loadingRagStatus = false;
        }
    }
    
    // Fetch RAG Status when component mounts
    onMount(() => {
        fetchRagStatus();
    });

    // Handle drag over
    function handleDragOver(event) {
        event.preventDefault();
        isDraggingOver = true;
    }

    // Handle drag leave
    function handleDragLeave() {
        isDraggingOver = false;
    }

    // Handle drop
    async function handleDrop(event) {
        event.preventDefault();
        isDraggingOver = false;
        
        try {
            const storyData = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (!droppedStories.some(story => story.id === storyData.id)) {
                // Fetch additional details for the story
                const response = await fetch(`/api/ado/user-story-details?projectId=${projectId}&userStoryId=${storyData.id}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch story details');
                }
                
                const { data: details } = await response.json();
                
                // Add the story with all details
                droppedStories = [...droppedStories, {
                    id: storyData.id,
                    title: storyData.title,
                    state: details['System.State'],
                    ragStatus: details['Custom.RAGStatus'] || 'Not Set',
                    startDate: details['Microsoft.VSTS.Scheduling.StartDate'],
                    targetDate: details['Microsoft.VSTS.Scheduling.TargetDate']
                }];
            }
        } catch (err) {
            console.error('Error handling drop:', err);
        }
    }

    // Remove dropped story
    function removeDroppedStory(storyId) {
        droppedStories = droppedStories.filter(story => story.id !== storyId);
    }

    // Handle drag start for resorting
    function handleDragStart(event, storyId) {
        draggedStoryId = storyId;
        event.dataTransfer.effectAllowed = 'move';
    }

    // Handle drag over for resorting
    function handleDragOverStory(event, storyId) {
        event.preventDefault();
        if (draggedStoryId === storyId) return;
        
        const draggedIndex = droppedStories.findIndex(story => story.id === draggedStoryId);
        const dropIndex = droppedStories.findIndex(story => story.id === storyId);
        
        if (draggedIndex !== -1 && dropIndex !== -1) {
            const newStories = [...droppedStories];
            const [draggedStory] = newStories.splice(draggedIndex, 1);
            newStories.splice(dropIndex, 0, draggedStory);
            droppedStories = newStories;
        }
    }

    // Handle drag end for resorting
    function handleDragEnd() {
        draggedStoryId = null;
    }
</script>

<div class="card mb-3" transition:fade>
    <!-- Header -->
    <div class="card-header d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
            <h5 class="card-title mb-0">
                {feature.fields['System.Title']}
            </h5>
            <span class="badge bg-secondary">#{feature.id}</span>
        </div>
        <div>
            {#if loadingRagStatus}
                <span class="badge bg-secondary me-2">Loading RAG Status...</span>
            {:else if ragStatus}
                <button class="btn btn-sm btn-success me-2">
                    <strong>Project Status: {ragStatus}</strong>
                </button>
            {/if}
        </div>
    </div>
    
    <!-- Body -->
    <div class="card-body">
        <!-- Description -->
        {#if feature.fields['System.Description']}
            <div class="mb-3">
                <h6>Description</h6>
                <div class="border rounded p-2 bg-light">
                    {@html feature.fields['System.Description']}
                </div>
            </div>
        {/if}
        
        <!-- Metadata -->
        <div class="row">
            <div class="col-md-6">
                <div class="d-flex flex-column">
                    <p><strong>Start Date:</strong> {formatDate(feature.fields['Microsoft.VSTS.Scheduling.StartDate'])}</p>
                    <p><strong>Target Date:</strong> {formatDate(feature.fields['Microsoft.VSTS.Scheduling.TargetDate'])}</p>
                </div>
            </div>
            <div class="col-md-6">
                {#if feature.fields['System.AssignedTo']}
                    <p><strong>Assigned To:</strong> {feature.fields['System.AssignedTo'].displayName}</p>
                {/if}
                {#if feature.fields['System.Priority']}
                    <p><strong>Priority:</strong> {feature.fields['System.Priority']}</p>
                {/if}
            </div>
        </div>
        
        <!-- Executive Summary (formerly RAG Status Comments) -->
        {#if ragStatusComments}
            <div class="mt-3">
                <h6 class="fw-bold">Executive Summary</h6>
                <div class="border rounded p-2 bg-light">
                    {@html ragStatusComments}
                </div>
            </div>
        {/if}
        
        <!-- Milestone Status (formerly Dropped User Stories) -->
        <div class="mt-4">
            <h6 class="fw-bold">Milestone Status</h6>
            <div 
                class="droppable-area p-3 border rounded {isDraggingOver ? 'dragging-over' : ''}"
                ondragover={handleDragOver}
                ondragleave={handleDragLeave}
                ondrop={handleDrop}
                role="region"
                aria-label="Drop zone for user stories"
            >
                {#if droppedStories.length === 0}
                    <div class="text-center text-muted py-3">
                        <i class="bi bi-arrow-down-circle"></i>
                        <p class="mb-0 mt-2">Drag user stories here</p>
                    </div>
                {:else}
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th style="width: 40px"></th>
                                    <th style="width: 100%"><span class="small text-muted text-uppercase">MILESTONE</span></th>
                                    <th></th>
                                    <th></th>
                                    <th><span class="small text-muted text-uppercase">START</span></th>
                                    <th><span class="small text-muted text-uppercase">TARGET</span></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each droppedStories as story}
                                    <tr 
                                        draggable="true"
                                        ondragstart={(e) => handleDragStart(e, story.id)}
                                        ondragover={(e) => handleDragOverStory(e, story.id)}
                                        ondragend={handleDragEnd}
                                    >
                                        <td class="text-muted">
                                            <i class="bi bi-grip-vertical"></i>
                                        </td>
                                        <td>{story.title}</td>
                                        <td>
                                            <span class="badge {getStatusBadgeClass(story.state)}">
                                                {story.state}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge {getRAGStatusBadgeClass(story.ragStatus)}">
                                                {story.ragStatus}
                                            </span>
                                        </td>
                                        <td class="text-nowrap small">{story.startDate ? formatDate(story.startDate) : '-'}</td>
                                        <td class="text-nowrap small">{story.targetDate ? formatDate(story.targetDate) : '-'}</td>
                                        <td class="text-end">
                                            <button 
                                                class="btn btn-link text-danger p-0"
                                                onclick={() => removeDroppedStory(story.id)}
                                                aria-label="Remove story"
                                            >
                                                <i class="bi bi-x"></i>
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Acceptance Criteria -->
        {#if feature.fields['Microsoft.VSTS.Common.AcceptanceCriteria']}
            <div class="mt-3">
                <h6>Acceptance Criteria</h6>
                <div class="border rounded p-2 bg-light">
                    {@html feature.fields['Microsoft.VSTS.Common.AcceptanceCriteria']}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .droppable-area {
        min-height: 100px;
        transition: all 0.2s ease;
    }
    
    .dragging-over {
        background-color: rgba(0, 123, 255, 0.1);
        border: 2px dashed #007bff;
    }
    
    .bi-grip-vertical {
        cursor: grab;
    }
    
    .table th {
        font-weight: normal;
    }
</style> 