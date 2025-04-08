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
</script>

<div class="container mt-4">
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
                    projectId={selectedProject?.id}
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
    {/if}
</div>

<style>

</style> 