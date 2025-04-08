<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import FeatureList from './FeatureList.svelte';
    import FeatureDisplay from './FeatureDisplay.svelte';

    // State variables
    let isLoading = $state(true);
    let error = $state(null);
    let projects = $state([]);
    let selectedProject = $state(null);
    let features = $state([]);
    let workItemTypes = $state([]);
    let selectedFeature = $state(null);
    let availableFields = $state(null);
    let showFields = $state(false);

    // Load data when component mounts
    onMount(async () => {
        await loadProjects();
    });

    // Load all projects
    async function loadProjects() {
        isLoading = true;
        error = null;

        try {
            const response = await fetch('/api/ado?type=projects');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load projects');
            }
            
            const data = await response.json();
            projects = data.data || [];
            
            // Find and select "Uturn Work" project
            const uturnProject = projects.find(p => p.name === "Uturn Work");
            if (uturnProject) {
                await selectProject(uturnProject);
            } else {
                error = "Uturn Work project not found";
            }
        } catch (err) {
            console.error('Error loading projects:', err);
            error = err.message;
            projects = [];
        } finally {
            isLoading = false;
        }
    }

    // Select a project and load its features
    async function selectProject(project) {
        selectedProject = project;
        isLoading = true;
        error = null;
        selectedFeature = null;

        try {
            // Load features
            const featuresResponse = await fetch(`/api/ado?type=projectFeatures&projectId=${project.id}`);
            
            if (!featuresResponse.ok) {
                const errorData = await featuresResponse.json();
                throw new Error(errorData.error || 'Failed to load features');
            }
            
            const featuresData = await featuresResponse.json();
            // Sort features alphabetically by title
            features = (featuresData.data || []).sort((a, b) => 
                a.fields['System.Title'].localeCompare(b.fields['System.Title'])
            );
        } catch (err) {
            console.error('Error loading project data:', err);
            error = err.message;
            features = [];
        } finally {
            isLoading = false;
        }
    }

    // Load features with a specific work item type
    async function loadFeaturesByType(workItemType) {
        if (!selectedProject) {
            error = "No project selected";
            return;
        }
        
        isLoading = true;
        error = null;
        selectedFeature = null;
        
        try {
            const response = await fetch(`/api/ado?type=projectFeaturesByType&projectId=${selectedProject.id}&workItemType=${encodeURIComponent(workItemType)}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to load features with type '${workItemType}'`);
            }
            
            const data = await response.json();
            // Sort features alphabetically by title
            features = (data.data || []).sort((a, b) => 
                a.fields['System.Title'].localeCompare(b.fields['System.Title'])
            );
        } catch (err) {
            console.error(`Error loading features with type '${workItemType}':`, err);
            error = err.message;
            features = [];
        } finally {
            isLoading = false;
        }
    }
    
    // Handle feature selection
    function handleFeatureSelect(feature) {
        console.log('Feature selected:', feature);
        console.log('Feature fields:', feature.fields);
        selectedFeature = feature;
        console.log('selectedFeature updated:', selectedFeature);
    }
    
    // Handle search
    function handleSearch(query) {
        console.log('Search query:', query);
    }

    // Fetch available fields
    async function fetchAvailableFields() {
        try {
            const response = await fetch('/api/ado?type=workItemFields');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load fields');
            }
            
            const data = await response.json();
            console.log('Available fields data:', data.data);
            
            // Log all field names
            console.log('All field names:');
            for (const category in data.data) {
                const fields = data.data[category];
                for (const field of fields) {
                    console.log(field.name);
                }
            }
            
            // Check if RAG Status fields exist
            let ragStatusExists = false;
            let ragStatusCommentsExists = false;
            
            // Search through all categories for the RAG Status fields
            for (const category in data.data) {
                const fields = data.data[category];
                for (const field of fields) {
                    if (field.name === 'Custom.RAGStatus') {
                        ragStatusExists = true;
                        console.log('Found RAG Status field:', field);
                    }
                    if (field.name === 'Custom.RAGStatusComments') {
                        ragStatusCommentsExists = true;
                        console.log('Found RAG Status Comments field:', field);
                    }
                }
            }
            
            console.log('RAG Status field exists:', ragStatusExists);
            console.log('RAG Status Comments field exists:', ragStatusCommentsExists);
            
            availableFields = data.data;
            showFields = true;
        } catch (err) {
            console.error('Error loading fields:', err);
            error = err.message;
        }
    }
</script>

<div class="container mt-4">
    <h1 class="mb-3">Azure DevOps - Uturn Work</h1>
    
    {#if error}
        <div class="alert alert-danger" role="alert" transition:fade>
            {error}
        </div>
    {/if}
    
    {#if isLoading}
        <div class="d-flex justify-content-center" transition:fade>
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    {:else}
        <div class="row">
            <!-- Features List -->
            <div class="col-md-4">
                <FeatureList 
                    features={features} 
                    workItemTypes={workItemTypes} 
                    onSearch={handleSearch}
                    onWorkItemTypeChange={loadFeaturesByType}
                    onFeatureSelect={handleFeatureSelect}
                    selectedFeatureId={selectedFeature?.id}
                />
            </div>
            
            <!-- Feature Display -->
            <div class="col-md-8">
                {#if selectedFeature}
                    <FeatureDisplay feature={selectedFeature} projectId={selectedProject?.id} />
                {:else}
                    <div class="alert alert-info">
                        Select a feature to view details
                    </div>
                {/if}
            </div>
        </div>

        <!-- Available Fields Button -->
        <div class="mt-3">
            <button class="btn btn-outline-secondary" onclick={fetchAvailableFields}>
                Show Available Fields
            </button>
        </div>

        <!-- Available Fields Display -->
        {#if showFields && availableFields}
            <div class="mt-3">
                <h3>Available Fields</h3>
                <div class="accordion" id="fieldsAccordion">
                    {#each Object.entries(availableFields) as [category, fields]}
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="heading{category}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse{category}" aria-expanded="false" aria-controls="collapse{category}">
                                    {category}
                                </button>
                            </h2>
                            <div id="collapse{category}" class="accordion-collapse collapse" aria-labelledby="heading{category}" data-bs-parent="#fieldsAccordion">
                                <div class="accordion-body">
                                    <ul class="list-group">
                                        {#each fields as field}
                                            <li class="list-group-item">
                                                <strong>{field.displayName}</strong> ({field.name})
                                                {#if field.description}
                                                    <p class="mb-0 text-muted">{field.description}</p>
                                                {/if}
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>

</style> 