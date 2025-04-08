<script>
    import { fade } from 'svelte/transition';

    // Props
    let { features = [], workItemTypes = [], onSearch, onWorkItemTypeChange, onFeatureSelect, selectedFeatureId } = $props();
    
    // State
    let searchQuery = $state('');
    let filteredFeatures = $state([...features]);
    
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
</script>

<div class="card mb-4">
    <div class="card-header">
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="card-title mb-0">Features</h5>
            <span class="badge bg-primary">{filteredFeatures.length} features</span>
        </div>
        
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
                        <span>{feature.fields['System.Title']}</span>
                        <span class="badge bg-secondary">{feature.id}</span>
                    </div>
                </button>
            {/each}
        {/if}
    </div>
</div> 