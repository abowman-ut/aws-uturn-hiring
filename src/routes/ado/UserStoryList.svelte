<script>
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    // Props
    let { projectId, featureId } = $props();
    
    // Create event dispatcher
    const dispatch = createEventDispatcher();
    
    // State
    let userStories = $state([]);
    let filteredStories = $state([]);
    let searchQuery = $state('');
    let statusFilter = $state('all');
    let isLoading = $state(false);
    let error = $state(null);
    let draggedStory = $state(null);
    
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
        if (isStoryClosed(state)) {
            return 'border border-secondary text-secondary';
        } else {
            return 'border border-success text-success';
        }
    }
    
    // Check if a story is closed
    function isStoryClosed(state) {
        const stateLower = state.toLowerCase();
        return stateLower.includes('done') || 
               stateLower.includes('completed') || 
               stateLower.includes('closed') || 
               stateLower.includes('resolved');
    }
    
    // Filter user stories based on search query and status
    function filterStories() {
        let filtered = [...userStories];
        
        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(story => 
                story.fields['System.Title'].toLowerCase().includes(query) ||
                story.id.toString().includes(query)
            );
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(story => {
                const state = story.fields['System.State'];
                if (statusFilter === 'closed') {
                    return isStoryClosed(state);
                } else if (statusFilter === 'not-closed') {
                    return !isStoryClosed(state);
                }
                return true;
            });
        }
        
        filteredStories = filtered;
    }
    
    // Handle search input change
    function handleSearchInput(event) {
        searchQuery = event.target.value;
        filterStories();
    }
    
    // Handle status filter change
    function handleStatusFilter(status) {
        statusFilter = status;
        filterStories();
    }
    
    // Load user stories when component mounts or when featureId changes
    $effect(() => {
        if (projectId && featureId) {
            loadUserStories();
        }
    });
    
    // Update filtered stories when userStories change
    $effect(() => {
        userStories;
        filterStories();
    });
    
    // Load user stories for the feature
    async function loadUserStories() {
        isLoading = true;
        error = null;
        
        try {
            const response = await fetch(`/api/ado?type=featureUserStories&projectId=${projectId}&featureId=${featureId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load user stories');
            }
            
            const data = await response.json();
            userStories = data.data || [];
        } catch (err) {
            console.error('Error loading user stories:', err);
            error = err.message;
            userStories = [];
        } finally {
            isLoading = false;
        }
    }

    // Handle drag start
    function handleDragStart(event, story) {
        draggedStory = story;
        event.dataTransfer.setData('text/plain', JSON.stringify({
            id: story.id,
            title: story.fields['System.Title'],
            state: story.fields['System.State'],
            ragStatus: story.fields['Custom.RAGStatus'] || 'Not Set',
            startDate: story.fields['Microsoft.VSTS.Scheduling.StartDate'] || null,
            targetDate: story.fields['Microsoft.VSTS.Scheduling.TargetDate'] || null
        }));
        event.dataTransfer.effectAllowed = 'move';
        dispatch('dragStart', { story });
    }

    // Handle drag end
    function handleDragEnd() {
        draggedStory = null;
        dispatch('dragEnd');
    }
</script>

<div class="card mb-3" transition:fade>
    <div class="card-header">
        <!-- Search Input -->
        <div class="input-group input-group-sm">
            <span class="input-group-text py-0" id="search-icon">
                <i class="bi bi-search"></i>
            </span>
            <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Search user stories..." 
                aria-label="Search user stories" 
                aria-describedby="search-icon"
                value={searchQuery}
                oninput={handleSearchInput}
            />
            {#if searchQuery}
                <button 
                    class="btn btn-outline-secondary btn-sm py-0" 
                    type="button" 
                    onclick={() => {
                        searchQuery = '';
                        filterStories();
                    }}
                    aria-label="Clear search"
                >
                    <i class="bi bi-x"></i>
                </button>
            {/if}
        </div>
        
        <!-- Status Filter -->
        <div class="mt-2 d-flex justify-content-between align-items-center">
            <div class="btn-group btn-group-sm">
                <button 
                    type="button" 
                    class="btn {statusFilter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}"
                    onclick={() => handleStatusFilter('all')}
                >
                    All
                </button>
                <button 
                    type="button" 
                    class="btn {statusFilter === 'not-closed' ? 'btn-secondary' : 'btn-outline-secondary'}"
                    onclick={() => handleStatusFilter('not-closed')}
                >
                    Not Closed
                </button>
                <button 
                    type="button" 
                    class="btn {statusFilter === 'closed' ? 'btn-secondary' : 'btn-outline-secondary'}"
                    onclick={() => handleStatusFilter('closed')}
                >
                    Closed
                </button>
            </div>
            
            <!-- Story Count -->
            <small class="text-muted">{filteredStories.length}/{userStories.length} stories</small>
        </div>
    </div>
    
    <div class="card-body">
        {#if isLoading}
            <div class="d-flex justify-content-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        {:else if error}
            <div class="alert alert-danger" role="alert">
                {error}
            </div>
        {:else if filteredStories.length === 0}
            <div class="alert alert-info">
                No user stories found for this feature.
            </div>
        {:else}
            <div class="list-group">
                {#each filteredStories as story}
                    <div 
                        class="list-group-item"
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, story)}
                        ondragend={handleDragEnd}
                        class:dragging={draggedStory?.id === story.id}
                    >
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">{story.fields['System.Title']}</h6>
                                <small class="text-muted">
                                    Created: {formatDate(story.fields['System.CreatedDate'])}
                                </small>
                            </div>
                            <div>
                                <span class="badge {getStatusBadgeClass(story.fields['System.State'])}">
                                    {story.fields['System.State']}
                                </span>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .dragging {
        opacity: 0.5;
        cursor: move;
    }
</style> 