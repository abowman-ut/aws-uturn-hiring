<script>
    import { base } from '$app/paths';
    import { slide } from 'svelte/transition';
    let title = $state('Positions');
    let pageTitle = $derived(title);
    let positions = $state([]);
    let showAddForm = $state(false);
    let isSubmitting = $state(false);
    let formError = $state(null);
    let formSuccess = $state(null);
    let selectedDepartment = $state('');
    let selectedTimeline = $state('');
    let showFilters = $state(true);

    // Form data
    let newPosition = $state({
        title: '',
        department: '',
        hiringManager: '',
        timeline: ''
    });

    const DEPARTMENTS = ['Engineering', 'Management', 'Sales'];
    const TIMELINES = ['Q1', 'Q2', 'Q3', 'Q4'];

    // Load data when component mounts
    $effect(() => {
        loadData();
    });

    async function loadData() {
        try {
            const response = await fetch('/api/positions');
            if (!response.ok) throw new Error('Failed to load positions');
            positions = await response.json();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    // Helper function to get filtered positions
    function getFilteredPositions() {
        return positions.filter(position => 
            (!selectedDepartment || position.department === selectedDepartment) &&
            (!selectedTimeline || position.timeline === selectedTimeline)
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        isSubmitting = true;
        formError = null;

        try {
            const response = await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPosition)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create position');
            }

            positions = [...positions, await response.json()];
            formSuccess = 'Position added successfully!';
            showAddForm = false;
            resetForm();
        } catch (error) {
            formError = error.message;
        } finally {
            isSubmitting = false;
        }
    }

    async function deletePosition(id) {
        if (!confirm('Are you sure you want to delete this position?')) return;
        
        try {
            const response = await fetch(`/api/positions?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete position');
            }

            positions = positions.filter(p => p.id !== id);
            formSuccess = 'Position deleted successfully!';
        } catch (error) {
            console.error('Error deleting position:', error);
            formError = error.message;
        }
    }

    function resetForm() {
        newPosition = {
            title: '',
            department: '',
            hiringManager: '',
            timeline: ''
        };
    }
</script>

<div class="container-fluid py-3">
    <div class="row g-3">
        <!-- Sidebar with entry form -->
        <div class="col-12 col-lg-3">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3">Add New Position</h5>
                    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
                        <div class="mb-3">
                            <input 
                                type="text" 
                                class="form-control"
                                bind:value={newPosition.title}
                                placeholder="Position Title"
                                required
                            />
                        </div>

                        <div class="mb-3">
                            <select class="form-select" bind:value={newPosition.department} required>
                                <option value="">Department</option>
                                {#each DEPARTMENTS as department}
                                    <option value={department}>{department}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="mb-3">
                            <input 
                                type="text" 
                                class="form-control"
                                bind:value={newPosition.hiringManager}
                                placeholder="Hiring Manager"
                                required
                            />
                        </div>

                        <div class="mb-3">
                            <select class="form-select" bind:value={newPosition.timeline} required>
                                <option value="">Timeline</option>
                                {#each TIMELINES as timeline}
                                    <option value={timeline}>{timeline}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-secondary" onclick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Adding...' : 'Add'}
                            </button>
                        </div>

                        {#if formError}
                            <div class="alert alert-danger mt-3">
                                <i class="bi bi-exclamation-circle-fill me-2"></i>
                                {formError}
                            </div>
                        {/if}

                        {#if formSuccess}
                            <div class="alert alert-success mt-3">
                                <i class="bi bi-check-circle-fill me-2"></i>
                                {formSuccess}
                            </div>
                        {/if}
                    </form>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="col">
            <div class="card">
                <div class="card-body">
                    <!-- Filters Toggle -->
                    <button 
                        type="button" 
                        class="btn btn-link d-flex align-items-center w-100 text-start text-decoration-none mb-3" 
                        onclick={() => showFilters = !showFilters}
                    >
                        <i class="bi bi-filter-circle-fill me-2"></i>
                        <span class="me-auto">Filters</span>
                        <small class="text-muted">Showing {getFilteredPositions().length} of {positions.length} positions &nbsp; </small>
                        <i class="bi bi-chevron-{showFilters ? 'up' : 'down'}"></i>
                    </button>

                    <!-- Filters Section with Transition -->
                    {#if showFilters}
                        <div class="mb-4" transition:slide={{ duration: 200 }}>
                            <div class="row g-3">
                                <div class="col-12 col-md-6">
                                    <select class="form-select" bind:value={selectedDepartment}>
                                        <option value="">All Departments</option>
                                        {#each DEPARTMENTS as department}
                                            <option value={department}>{department}</option>
                                        {/each}
                                    </select>
                                </div>
                                <div class="col-12 col-md-6">
                                    <select class="form-select" bind:value={selectedTimeline}>
                                        <option value="">All Timelines</option>
                                        {#each TIMELINES as timeline}
                                            <option value={timeline}>{timeline}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Positions List -->
                    <div class="positions-list">
                        {#if getFilteredPositions().length === 0}
                            <div class="text-center text-muted py-5">
                                <i class="bi bi-briefcase display-4"></i>
                                <p class="mt-2">No positions found</p>
                            </div>
                        {:else}
                            <div class="row g-3">
                                {#each getFilteredPositions() as position}
                                    <div class="col-12 col-md-6 col-xl-4">
                                        <div class="card h-100">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h5 class="card-title mb-1">{position.title}</h5>
                                                        <span class="badge bg-primary">
                                                            {position.department}
                                                        </span>
                                                    </div>
                                                    <div class="d-flex align-items-center gap-3">
                                                        <span class="text-muted">
                                                            <i class="bi bi-calendar me-1"></i>
                                                            {position.timeline}
                                                        </span>
                                                        <button 
                                                            class="btn btn-outline-danger btn-sm"
                                                            onclick={() => deletePosition(position.id)}
                                                            title="Delete position"
                                                            aria-label="Delete {position.title} position"
                                                        >
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div class="d-flex align-items-center text-muted">
                                                    <i class="bi bi-person me-2"></i>
                                                    <span>{position.hiringManager}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>

</style> 