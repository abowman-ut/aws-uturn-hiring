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
        if (!status) return 'bg-secondary';
        
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
</script>

<div class="card mb-3" transition:fade>
    <!-- Header -->
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">
            {feature.fields['System.Title']}
        </h5>
        <div>
            <span class="badge {getStatusBadgeClass(feature.fields['System.State'])} me-2">
                {feature.fields['System.State']}
            </span>
            {#if loadingRagStatus}
                <span class="badge bg-secondary me-2">Loading RAG Status...</span>
            {:else if ragStatus}
                <span class="badge {getRAGStatusBadgeClass(ragStatus)} me-2">
                    {ragStatus}
                </span>
            {/if}
            <span class="badge bg-secondary">#{feature.id}</span>
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
                <p><strong>Created:</strong> {formatDate(feature.fields['System.CreatedDate'])}</p>
                <p><strong>Changed:</strong> {formatDate(feature.fields['System.ChangedDate'])}</p>
            </div>
            <div class="col-md-6">
                {#if feature.fields['System.AssignedTo']}
                    <p><strong>Assigned To:</strong> {feature.fields['System.AssignedTo'].displayName}</p>
                {/if}
                {#if feature.fields['System.Priority']}
                    <p><strong>Priority:</strong> {feature.fields['System.Priority']}</p>
                {/if}
                {#if ragStatus}
                    <p><strong>RAG Status:</strong> {ragStatus}</p>
                {/if}
            </div>
        </div>
        
        <!-- RAG Status Comments -->
        {#if ragStatusComments}
            <div class="mt-3">
                <h6>RAG Status Comments</h6>
                <div class="border rounded p-2 bg-light">
                    {@html ragStatusComments}
                </div>
            </div>
        {/if}
        
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