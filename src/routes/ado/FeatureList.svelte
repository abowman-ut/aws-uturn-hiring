<script>
    import { fade } from 'svelte/transition';
    import UserStoryList from './UserStoryList.svelte';

    // Props
    let { features = [], workItemTypes = [], onSearch, onWorkItemTypeChange, onFeatureSelect, selectedFeatureId, projectId } = $props();
    
    // State
    let searchQuery = $state('');
    let filteredFeatures = $state([...features]);
    let featuresWithStories = $state(new Set());
    let loadingStories = $state(false);
    
    // Filter features based on search query
    function filterFeatures() {
        if (!searchQuery.trim()) {
            filteredFeatures = [...features];
        } else {
            const query = searchQuery.toLowerCase().trim();
            filteredFeatures = features.filter(feature => 
                feature.fields['System.Title'].toLowerCase().includes(query) ||
                feature.id.toString().includes(query)
            );
        }
        
        // Notify parent component of search
        if (onSearch) {
            onSearch(searchQuery);
        }
    }

    // Handle search input change
    function handleSearchInput(event) {
        searchQuery = event.target.value;
        filterFeatures();
    }
    
    // Update filtered features when features prop changes
    $effect(() => {
        features;
        filterFeatures();
    });
    
    // Check if a feature has user stories
    async function checkFeatureHasStories(featureId) {
        if (!projectId || !featureId) return false;
        
        try {
            const response = await fetch(`/api/ado?type=featureUserStories&projectId=${projectId}&featureId=${featureId}`);
            
            if (!response.ok) {
                return false;
            }
            
            const data = await response.json();
            return data.data && data.data.length > 0;
        } catch (err) {
            console.error('Error checking user stories:', err);
            return false;
        }
    }
    
    // Load user story counts for all features
    async function loadUserStoryCounts() {
        if (!projectId || features.length === 0) return;
        
        loadingStories = true;
        featuresWithStories = new Set();
        
        try {
            // Check a few features at a time to avoid overwhelming the API
            const batchSize = 5;
            for (let i = 0; i < features.length; i += batchSize) {
                const batch = features.slice(i, i + batchSize);
                const promises = batch.map(feature => checkFeatureHasStories(feature.id));
                const results = await Promise.all(promises);
                
                // Add features with stories to the set
                batch.forEach((feature, index) => {
                    if (results[index]) {
                        featuresWithStories.add(feature.id);
                    }
                });
            }
        } catch (err) {
            console.error('Error loading user story counts:', err);
        } finally {
            loadingStories = false;
        }
    }
    
    // Load user story counts when features change
    $effect(() => {
        if (features.length > 0 && projectId) {
            loadUserStoryCounts();
        }
    });
</script>

<div class="card mb-4">
    <div class="card-header">
        <!-- Search Input -->
        <div class="input-group input-group-sm">
            <span class="input-group-text py-0" id="search-icon">
                <i class="bi bi-search"></i>
            </span>
            <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Search features..." 
                aria-label="Search features" 
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
                        filterFeatures();
                    }}
                    aria-label="Clear search"
                >
                    <i class="bi bi-x"></i>
                </button>
            {/if}
        </div>
        
        <!-- Feature Count -->
        <div class="mt-2 text-end">
            <small class="text-muted">{filteredFeatures.length}/{features.length} features</small>
        </div>
        
        <!-- Work Item Type Selector -->
        {#if workItemTypes.length > 0}
            <div class="mt-2">
                <div class="input-group input-group-sm">
                    <label class="input-group-text" for="workItemTypeSelect">Work Item Type:</label>
                    <select 
                        class="form-select form-select-sm" 
                        id="workItemTypeSelect"
                        onchange={(e) => onWorkItemTypeChange?.(e.target.value)}
                    >
                        <option value="">Select a type...</option>
                        {#each workItemTypes as type}
                            <option value={type.name}>{type.name}</option>
                        {/each}
                    </select>
                </div>
            </div>
        {/if}
    </div>
    
    <!-- Features List -->
    <div class="list-group list-group-flush">
        {#if filteredFeatures.length === 0}
            <div class="list-group-item">No features found</div>
        {:else}
            {#each filteredFeatures as feature}
                <button 
                    type="button"
                    class="list-group-item list-group-item-action {selectedFeatureId === feature.id ? 'active' : ''}"
                    onclick={() => {
                        console.log('Feature clicked:', feature);
                        onFeatureSelect?.(feature);
                    }}
                >
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <span>{feature.fields['System.Title']}</span>
                        </div>
                        <div>
                            <span class="badge {feature.fields['System.State'].toLowerCase().includes('done') || feature.fields['System.State'].toLowerCase().includes('completed') ? 'bg-success' : 'bg-secondary'}">
                                {feature.fields['System.State']}
                            </span>
                        </div>
                    </div>
                </button>
            {/each}
        {/if}
    </div>
</div>

<!-- User Stories List -->
{#if selectedFeatureId && projectId && filteredFeatures.some(f => f.id === selectedFeatureId)}
    <UserStoryList {projectId} featureId={selectedFeatureId} />
{/if} 