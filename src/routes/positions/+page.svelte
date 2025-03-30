<script>
    import { base } from '$app/paths';
    import { slide } from 'svelte/transition';
    import { onMount } from 'svelte';

    let title = $state('Positions');
    let pageTitle = $derived(title);
    let positions = $state([]);
    let showAddForm = $state(false);
    let isSubmitting = $state(false);
    let formError = $state(null);
    let formSuccess = $state(null);
    let window = $state({ innerWidth: 0 });

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

    onMount(() => {
        window.innerWidth = globalThis.window.innerWidth;
        const handleResize = () => {
            window.innerWidth = globalThis.window.innerWidth;
        };
        globalThis.window.addEventListener('resize', handleResize);
        return () => {
            globalThis.window.removeEventListener('resize', handleResize);
        };
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
        return positions;
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
    <div class="row">
        <!-- Add Position Button (visible on mobile) -->
        <div class="col-12 d-lg-none mb-3">
            <div class="d-flex justify-content-end">
                <button 
                    type="button" 
                    class="btn btn-primary d-inline-flex align-items-center" 
                    onclick={() => showAddForm = !showAddForm}
                    disabled={showAddForm}
                >
                    <i class="bi bi-{showAddForm ? 'dash' : 'plus'}-circle me-2"></i>
                    Add Position
                </button>
            </div>
        </div>

        <!-- Sidebar with entry form -->
        {#if showAddForm || window.innerWidth >= 992}
            <div class="col-12 col-lg-4 col-xl-3" transition:slide={{ duration: 300 }}>
                <div class="card">
                    <div class="card-body">
                        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
                            <div class="row g-3">
                                <div class="col-12">
                                    <input 
                                        type="text" 
                                        class="form-control"
                                        id="positionTitle"
                                        bind:value={newPosition.title}
                                        placeholder="Position Title"
                                        required
                                    />
                                </div>

                                <div class="col-12">
                                    <div class="select-wrapper">
                                        <i class="bi bi-building select-icon"></i>
                                        <select class="form-select ps-4" id="department" bind:value={newPosition.department} required>
                                            <option value="">&nbsp; Select department</option>
                                            {#each DEPARTMENTS as department}
                                                <option value={department}>{department}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <input 
                                        type="text" 
                                        class="form-control"
                                        id="hiringManager"
                                        bind:value={newPosition.hiringManager}
                                        placeholder="Hiring Manager"
                                        required
                                    />
                                </div>

                                <div class="col-12">
                                    <div class="select-wrapper">
                                        <i class="bi bi-calendar select-icon"></i>
                                        <select class="form-select ps-4" id="timeline" bind:value={newPosition.timeline} required>
                                            <option value="">&nbsp; Select timeline</option>
                                            {#each TIMELINES as timeline}
                                                <option value={timeline}>{timeline}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="d-flex justify-content-end gap-2">
                                        <button type="button" class="btn btn-secondary" style="width: 100px;" onclick={resetForm}>
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" style="width: 100px;" disabled={isSubmitting}>
                                            {isSubmitting ? 'Adding...' : 'Add'}
                                        </button>
                                    </div>
                                </div>

                                {#if formError}
                                    <div class="col-12">
                                        <div class="alert alert-danger">
                                            <i class="bi bi-exclamation-circle-fill me-2"></i>
                                            {formError}
                                        </div>
                                    </div>
                                {/if}

                                {#if formSuccess}
                                    <div class="col-12">
                                        <div class="alert alert-success">
                                            <i class="bi bi-check-circle-fill me-2"></i>
                                            {formSuccess}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Main Content -->
        <div class="col">
            <div class="card">
                <div class="card-body">
                    <!-- Positions List -->
                    <div class="positions-list">
                        {#if positions.length === 0}
                            <div class="text-center text-muted py-5">
                                <i class="bi bi-briefcase display-4"></i>
                                <p class="mt-2">No positions found</p>
                            </div>
                        {:else}
                            <div class="row g-3">
                                {#each positions as position}
                                    <div class="col-12 col-md-6 col-xl-4">
                                        <div class="card h-100">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h5 class="card-title mb-1 text-body-emphasis">{position.title}</h5>
                                                        <span class="badge bg-primary">
                                                            {position.department}
                                                        </span>
                                                    </div>
                                                    <div class="d-flex align-items-center gap-2">
                                                        <button 
                                                            class="btn btn-info btn-sm"
                                                            title="Timeline"
                                                            disabled
                                                        >
                                                            {position.timeline}
                                                        </button>
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
                                                
                                                <div class="d-flex align-items-center text-muted small">
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
    /* Select with icon styles */
    .select-wrapper {
        position: relative;
    }

    .select-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
        color: #6c757d;
        pointer-events: none;
    }

    .select-wrapper select {
        padding-left: 35px;
    }
</style> 