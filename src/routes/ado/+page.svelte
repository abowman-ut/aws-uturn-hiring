<script>
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // State variables
    let isLoading = $state(true);
    let error = $state(null);
    let projects = $state([]);
    let selectedProject = $state(null);
    let projectDetails = $state(null);
    let features = $state([]);
    let filteredFeatures = $state([]);
    let selectedFeature = $state(null);
    let userStories = $state([]);
    let filteredUserStories = $state([]);
    let selectedUserStory = $state(null);
    let tasks = $state([]);
    let selectedTask = $state(null);
    let loadingStories = $state(false);
    let loadingTasks = $state(false);
    let showDebug = $state(false);
    let searchQuery = $state('');
    let selectedStoryState = $state('all');
    let debugData = $state({
        projects: null,
        projectDetails: null,
        features: null,
        userStories: null,
        tasks: null
    });

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
            debugData.projects = data;
            
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

    // Select a project and load its details
    async function selectProject(project) {
        selectedProject = project;
        selectedFeature = null;
        selectedUserStory = null;
        userStories = [];
        filteredUserStories = [];
        tasks = [];
        isLoading = true;
        error = null;

        try {
            // Load project details
            const detailsResponse = await fetch(`/api/ado?type=projectDetails&projectId=${project.id}`);
            
            if (!detailsResponse.ok) {
                const errorData = await detailsResponse.json();
                throw new Error(errorData.error || 'Failed to load project details');
            }
            
            const detailsData = await detailsResponse.json();
            projectDetails = detailsData.data;
            debugData.projectDetails = detailsData;

            // Load features
            const featuresResponse = await fetch(`/api/ado?type=projectFeatures&projectId=${project.id}`);
            
            if (!featuresResponse.ok) {
                const errorData = await featuresResponse.json();
                throw new Error(errorData.error || 'Failed to load features');
            }
            
            const featuresData = await featuresResponse.json();
            debugData.features = featuresData;
            // Sort features alphabetically by title
            features = (featuresData.data || []).sort((a, b) => 
                a.fields['System.Title'].localeCompare(b.fields['System.Title'])
            );
            // Initialize filtered features
            filteredFeatures = [...features];
        } catch (err) {
            console.error('Error loading project data:', err);
            error = err.message;
            projectDetails = null;
            features = [];
            filteredFeatures = [];
        } finally {
            isLoading = false;
        }
    }

    // Select a feature and load its user stories
    async function selectFeature(feature) {
        // Only update if it's a different feature
        if (selectedFeature?.id === feature.id) return;
        
        selectedFeature = feature;
        selectedUserStory = null;
        tasks = [];
        loadingStories = true;
        error = null;
        selectedStoryState = 'all';

        try {
            // Load user stories for the feature
            const userStoriesResponse = await fetch(`/api/ado?type=featureUserStories&projectId=${selectedProject.id}&featureId=${feature.id}`);
            
            if (!userStoriesResponse.ok) {
                const errorData = await userStoriesResponse.json();
                throw new Error(errorData.error || 'Failed to load user stories');
            }
            
            const userStoriesData = await userStoriesResponse.json();
            debugData.userStories = userStoriesData;
            userStories = userStoriesData.data || [];
            // Initialize filtered user stories
            filteredUserStories = [...userStories];
        } catch (err) {
            console.error('Error loading user stories:', err);
            error = err.message;
            userStories = [];
            filteredUserStories = [];
        } finally {
            loadingStories = false;
        }
    }

    // Select a user story and load its tasks
    async function selectUserStory(story) {
        // Only update if it's a different story
        if (selectedUserStory?.id === story.id) return;
        
        selectedUserStory = story;
        selectedTask = null; // Reset selected task
        loadingTasks = true;
        error = null;

        try {
            // Load tasks for the user story
            const tasksResponse = await fetch(`/api/ado?type=userStoryTasks&projectId=${selectedProject.id}&userStoryId=${story.id}`);
            
            if (!tasksResponse.ok) {
                const errorData = await tasksResponse.json();
                throw new Error(errorData.error || 'Failed to load tasks');
            }
            
            const tasksData = await tasksResponse.json();
            debugData.tasks = tasksData;
            tasks = tasksData.data || [];
        } catch (err) {
            console.error('Error loading tasks:', err);
            error = err.message;
            tasks = [];
        } finally {
            loadingTasks = false;
        }
    }

    // Select a task to view its details
    function selectTask(task) {
        selectedTask = task;
    }

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
    }

    // Handle search input change
    function handleSearchInput(event) {
        searchQuery = event.target.value;
        filterFeatures();
    }

    // Filter user stories by state
    function filterUserStoriesByState(state) {
        selectedStoryState = state;
        if (state === 'all') {
            filteredUserStories = [...userStories];
        } else {
            filteredUserStories = userStories.filter(story => 
                story.fields['System.State'].toLowerCase() === state.toLowerCase()
            );
        }
    }

    // Format date
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Get status badge class
    function getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'done':
                return 'bg-success';
            case 'in progress':
            case 'active':
                return 'bg-primary';
            case 'failed':
                return 'bg-danger';
            case 'cancelling':
            case 'cancelled':
                return 'bg-warning';
            default:
                return 'bg-secondary';
        }
    }

    // Toggle debug panel
    function toggleDebug() {
        showDebug = !showDebug;
    }
</script>

<div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h1>Azure DevOps - Uturn Work</h1>
        <button class="btn btn-sm btn-outline-secondary" onclick={toggleDebug}>
            {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
    </div>
    
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
                <div class="card mb-4">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="card-title mb-0">Features</h5>
                            <span class="badge bg-primary">{filteredFeatures.length} features</span>
                        </div>
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
                    </div>
                    <div class="list-group list-group-flush">
                        {#if filteredFeatures.length === 0}
                            <div class="list-group-item">No features found</div>
                        {:else}
                            {#each filteredFeatures as feature}
                                <button 
                                    class="list-group-item list-group-item-action {selectedFeature?.id === feature.id ? 'active' : ''}"
                                    onclick={() => selectFeature(feature)}
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
                
                <!-- Feature Details -->
                {#if selectedFeature}
                    <div class="card" transition:fly={{ y: 20, duration: 300, easing: quintOut }}>
                        <div class="card-header">
                            <h5 class="card-title mb-0">{selectedFeature.fields['System.Title']}</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>State:</strong> 
                                <span class="badge {getStatusBadgeClass(selectedFeature.fields['System.State'])}">
                                    {selectedFeature.fields['System.State']}
                                </span>
                            </p>
                            <p><strong>Created:</strong> {formatDate(selectedFeature.fields['System.CreatedDate'])}</p>
                            <p><strong>Changed:</strong> {formatDate(selectedFeature.fields['System.ChangedDate'])}</p>
                        </div>
                    </div>
                {/if}
            </div>
            
            <!-- User Stories -->
            <div class="col-md-8">
                <div class="card mb-4" transition:fly={{ y: 20, duration: 300, easing: quintOut }}>
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="card-title mb-0">User Stories</h5>
                            <span class="badge bg-primary">{filteredUserStories.length} stories</span>
                        </div>
                        <div class="btn-group btn-group-sm" role="group" aria-label="Filter user stories by state">
                            <button 
                                type="button" 
                                class="btn {selectedStoryState === 'all' ? 'btn-primary' : 'btn-outline-primary'}" 
                                onclick={() => filterUserStoriesByState('all')}
                            >
                                All
                            </button>
                            <button 
                                type="button" 
                                class="btn {selectedStoryState === 'new' ? 'btn-primary' : 'btn-outline-primary'}" 
                                onclick={() => filterUserStoriesByState('new')}
                            >
                                New
                            </button>
                            <button 
                                type="button" 
                                class="btn {selectedStoryState === 'active' ? 'btn-primary' : 'btn-outline-primary'}" 
                                onclick={() => filterUserStoriesByState('active')}
                            >
                                Active
                            </button>
                            <button 
                                type="button" 
                                class="btn {selectedStoryState === 'resolved' ? 'btn-primary' : 'btn-outline-primary'}" 
                                onclick={() => filterUserStoriesByState('resolved')}
                            >
                                Resolved
                            </button>
                            <button 
                                type="button" 
                                class="btn {selectedStoryState === 'closed' ? 'btn-primary' : 'btn-outline-primary'}" 
                                onclick={() => filterUserStoriesByState('closed')}
                            >
                                Closed
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        {#if !selectedFeature}
                            <div class="alert alert-info" transition:fade>
                                Select a feature to view its user stories
                            </div>
                        {:else if loadingStories}
                            <div class="d-flex justify-content-center py-4" transition:fade>
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading user stories...</span>
                                </div>
                            </div>
                        {:else if filteredUserStories.length === 0}
                            <p transition:fade>No user stories found for this feature</p>
                        {:else}
                            <div class="table-responsive" transition:fade>
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title</th>
                                            <th>State</th>
                                            <th>Created</th>
                                            <th>Changed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each filteredUserStories as story, index}
                                            <tr 
                                                transition:fly={{ y: 20, duration: 300, delay: index * 50, easing: quintOut }}
                                                class="cursor-pointer {selectedUserStory?.id === story.id ? 'table-primary' : ''}"
                                                onclick={() => selectUserStory(story)}
                                            >
                                                <td>{story.id}</td>
                                                <td>{story.fields['System.Title']}</td>
                                                <td>
                                                    <span class="badge {getStatusBadgeClass(story.fields['System.State'])}">
                                                        {story.fields['System.State']}
                                                    </span>
                                                </td>
                                                <td>{formatDate(story.fields['System.CreatedDate'])}</td>
                                                <td>{formatDate(story.fields['System.ChangedDate'])}</td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Tasks -->
                {#if selectedUserStory}
                    <div class="card" transition:fly={{ y: 20, duration: 300, easing: quintOut }}>
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">Tasks for User Story #{selectedUserStory.id}</h5>
                                <span class="badge bg-primary">{tasks.length} tasks</span>
                            </div>
                        </div>
                        <div class="card-body">
                            {#if loadingTasks}
                                <div class="d-flex justify-content-center py-4" transition:fade>
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading tasks...</span>
                                    </div>
                                </div>
                            {:else if tasks.length === 0}
                                <p transition:fade>No tasks found for this user story</p>
                            {:else}
                                <div class="table-responsive" transition:fade>
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Title</th>
                                                <th>State</th>
                                                <th>Assigned To</th>
                                                <th>Priority</th>
                                                <th>Due Date</th>
                                                <th>Created</th>
                                                <th>Changed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each tasks as task, index}
                                                <tr 
                                                    transition:fly={{ y: 20, duration: 300, delay: index * 50, easing: quintOut }}
                                                    class="cursor-pointer {selectedTask?.id === task.id ? 'table-primary' : ''}"
                                                    onclick={() => selectTask(task)}
                                                >
                                                    <td>{task.id}</td>
                                                    <td>{task.fields['System.Title']}</td>
                                                    <td>
                                                        <span class="badge {getStatusBadgeClass(task.fields['System.State'])}">
                                                            {task.fields['System.State']}
                                                        </span>
                                                    </td>
                                                    <td>{task.fields['System.AssignedTo']?.displayName || '-'}</td>
                                                    <td>
                                                        {#if task.fields['System.Priority']}
                                                            <span class="badge bg-{task.fields['System.Priority'] <= 2 ? 'danger' : task.fields['System.Priority'] <= 3 ? 'warning' : 'info'}">
                                                                {task.fields['System.Priority']}
                                                            </span>
                                                        {:else}
                                                            -
                                                        {/if}
                                                    </td>
                                                    <td>{task.fields['System.DueDate'] ? formatDate(task.fields['System.DueDate']) : '-'}</td>
                                                    <td>{formatDate(task.fields['System.CreatedDate'])}</td>
                                                    <td>{formatDate(task.fields['System.ChangedDate'])}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Task Details -->
                    {#if selectedTask}
                        <div class="card mt-3" transition:fly={{ y: 20, duration: 300, easing: quintOut }}>
                            <div class="card-header">
                                <h5 class="card-title mb-0">Task Details</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>ID:</strong> {selectedTask.id}</p>
                                        <p><strong>Title:</strong> {selectedTask.fields['System.Title']}</p>
                                        <p><strong>State:</strong> 
                                            <span class="badge {getStatusBadgeClass(selectedTask.fields['System.State'])}">
                                                {selectedTask.fields['System.State']}
                                            </span>
                                        </p>
                                        <p><strong>Assigned To:</strong> {selectedTask.fields['System.AssignedTo']?.displayName || '-'}</p>
                                        <p><strong>Priority:</strong> 
                                            {#if selectedTask.fields['System.Priority']}
                                                <span class="badge bg-{selectedTask.fields['System.Priority'] <= 2 ? 'danger' : selectedTask.fields['System.Priority'] <= 3 ? 'warning' : 'info'}">
                                                    {selectedTask.fields['System.Priority']}
                                                </span>
                                            {:else}
                                                -
                                            {/if}
                                        </p>
                                        <p><strong>Area Path:</strong> {selectedTask.fields['System.AreaPath'] || '-'}</p>
                                        <p><strong>Iteration Path:</strong> {selectedTask.fields['System.IterationPath'] || '-'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Created:</strong> {formatDate(selectedTask.fields['System.CreatedDate'])}</p>
                                        <p><strong>Created By:</strong> {selectedTask.fields['System.CreatedBy']?.displayName || '-'}</p>
                                        <p><strong>Changed:</strong> {formatDate(selectedTask.fields['System.ChangedDate'])}</p>
                                        <p><strong>Changed By:</strong> {selectedTask.fields['System.ChangedBy']?.displayName || '-'}</p>
                                        <p><strong>Due Date:</strong> {selectedTask.fields['System.DueDate'] ? formatDate(selectedTask.fields['System.DueDate']) : '-'}</p>
                                        <p><strong>Start Date:</strong> {selectedTask.fields['System.StartDate'] ? formatDate(selectedTask.fields['System.StartDate']) : '-'}</p>
                                        <p><strong>Target Date:</strong> {selectedTask.fields['System.TargetDate'] ? formatDate(selectedTask.fields['System.TargetDate']) : '-'}</p>
                                    </div>
                                </div>
                                
                                {#if selectedTask.fields['System.Description']}
                                    <div class="mt-3">
                                        <h6>Description</h6>
                                        <div class="border rounded p-3 bg-light">
                                            {selectedTask.fields['System.Description']}
                                        </div>
                                    </div>
                                {/if}
                                
                                {#if selectedTask.fields['Microsoft.VSTS.Common.AcceptanceCriteria']}
                                    <div class="mt-3">
                                        <h6>Acceptance Criteria</h6>
                                        <div class="border rounded p-3 bg-light">
                                            {selectedTask.fields['Microsoft.VSTS.Common.AcceptanceCriteria']}
                                        </div>
                                    </div>
                                {/if}
                                
                                <div class="mt-3">
                                    <h6>Additional Information</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p><strong>Effort:</strong> {selectedTask.fields['System.Effort'] || '-'}</p>
                                            <p><strong>Remaining Work:</strong> {selectedTask.fields['System.RemainingWork'] || '-'}</p>
                                            <p><strong>Completed Work:</strong> {selectedTask.fields['System.CompletedWork'] || '-'}</p>
                                            <p><strong>Original Estimate:</strong> {selectedTask.fields['System.OriginalEstimate'] || '-'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Tags:</strong> {selectedTask.fields['System.Tags'] || '-'}</p>
                                            <p><strong>Reason:</strong> {selectedTask.fields['System.Reason'] || '-'}</p>
                                            <p><strong>Comment Count:</strong> {selectedTask.fields['System.CommentCount'] || '0'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>
        </div>

        <!-- Debug Panel -->
        {#if showDebug}
            <div class="card mt-4" transition:fade>
                <div class="card-header bg-dark text-white">
                    <h5 class="card-title mb-0">Azure DevOps API Responses</h5>
                </div>
                <div class="card-body">
                    <ul class="nav nav-tabs" id="debugTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="projects-tab" data-bs-toggle="tab" data-bs-target="#projects" type="button" role="tab" aria-controls="projects" aria-selected="true">Projects</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="projectDetails-tab" data-bs-toggle="tab" data-bs-target="#projectDetails" type="button" role="tab" aria-controls="projectDetails" aria-selected="false">Project Details</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="features-tab" data-bs-toggle="tab" data-bs-target="#features" type="button" role="tab" aria-controls="features" aria-selected="false">Features</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="userStories-tab" data-bs-toggle="tab" data-bs-target="#userStories" type="button" role="tab" aria-controls="userStories" aria-selected="false">User Stories</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="tasks-tab" data-bs-toggle="tab" data-bs-target="#tasks" type="button" role="tab" aria-controls="tasks" aria-selected="false">Tasks</button>
                        </li>
                    </ul>
                    <div class="tab-content p-3" id="debugTabsContent">
                        <div class="tab-pane fade show active" id="projects" role="tabpanel" aria-labelledby="projects-tab">
                            <pre class="bg-light p-3 rounded"><code>{JSON.stringify(debugData.projects, null, 2)}</code></pre>
                        </div>
                        <div class="tab-pane fade" id="projectDetails" role="tabpanel" aria-labelledby="projectDetails-tab">
                            <pre class="bg-light p-3 rounded"><code>{JSON.stringify(debugData.projectDetails, null, 2)}</code></pre>
                        </div>
                        <div class="tab-pane fade" id="features" role="tabpanel" aria-labelledby="features-tab">
                            <pre class="bg-light p-3 rounded"><code>{JSON.stringify(debugData.features, null, 2)}</code></pre>
                        </div>
                        <div class="tab-pane fade" id="userStories" role="tabpanel" aria-labelledby="userStories-tab">
                            <pre class="bg-light p-3 rounded"><code>{JSON.stringify(debugData.userStories, null, 2)}</code></pre>
                        </div>
                        <div class="tab-pane fade" id="tasks" role="tabpanel" aria-labelledby="tasks-tab">
                            <pre class="bg-light p-3 rounded"><code>{JSON.stringify(debugData.tasks, null, 2)}</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .cursor-pointer {
        cursor: pointer;
    }
</style> 