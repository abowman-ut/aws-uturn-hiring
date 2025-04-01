<script>
    import { base } from '$app/paths';
    import { slide } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { untrack } from 'svelte';

    let title = $state('Positions');
    let pageTitle = $derived(title);
    let positions = $state([]);
    let showAddForm = $state(false);
    let isSubmitting = $state(false);
    let formError = $state(null);
    let formSuccess = $state(null);
    let window = $state({ innerWidth: 0 });
    let isLoading = $state(true);

    // Form data
    let newPosition = $state({
        title: '',
        department: '',
        hiringManager: '',
        timeline: '',
        state: 'open',
        payRange: {
            min: '',
            max: ''
        }
    });

    const DEPARTMENTS = ['Engineering', 'Management', 'Sales'];
    const TIMELINES = ['Q1', 'Q2', 'Q3', 'Q4'];

    // Update state options
    const STATES = {
        'open': { label: 'Open', class: 'text-primary' },
        'on_hold': { label: 'On Hold', class: 'text-warning' },
        'cancelled': { label: 'Cancelled', class: 'text-danger' },
        'filled': { label: 'Filled', class: 'text-success' }
    };

    // Add state for salary popup
    let activeSalaryPopup = $state(null);

    // Add state for status menu
    let activeStatusMenu = $state(null);

    // Add state for candidate counts
    let candidateCounts = $state({});

    // Load data and candidate counts when component mounts
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
        isLoading = true;
        try {
            const response = await fetch('/api/positions');
            if (!response.ok) throw new Error('Failed to load positions');
            positions = await response.json();
            
            // Load candidate counts for all positions
            await Promise.all(positions.map(async (position) => {
                const counts = await loadCandidateCounts(position.id);
                candidateCounts[position.id] = counts;
            }));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            isLoading = false;
        }
    }

    // Load candidate counts for each position
    async function loadCandidateCounts(positionId) {
        try {
            const response = await fetch(`/api/positions/candidates?positionId=${positionId}`);
            if (!response.ok) throw new Error('Failed to load candidate counts');
            return await response.json();
        } catch (error) {
            console.error('Error loading candidate counts:', error);
            return {
                total: 0,
                stages: {
                    cv_review: 0,
                    culture_fit: 0,
                    interview: 0
                }
            };
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
            timeline: '',
            state: 'open',
            payRange: {
                min: '',
                max: ''
            }
        };
    }

    // Add function to update position state
    async function updatePositionState(position, newState) {
        try {
            // Create updated position with new state
            const updatedPosition = {
                ...position,
                state: newState,
                updatedAt: new Date().toISOString()
            };
            
            // Send the update
            const response = await fetch('/api/positions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPosition)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update position');
            }

            // Get the updated position from the response
            const result = await response.json();

            // Update the positions array
            positions = positions.map(p => 
                p.id === position.id ? result : p
            );

            // Close the menu
            activeStatusMenu = null;
        } catch (error) {
            console.error('Error updating position state:', error);
            formError = error.message;
        }
    }

    // Add state for showing salary
    function toggleSalary(positionId) {
        positions = positions.map(p => ({
            ...p,
            showSalary: p.id === positionId ? !p.showSalary : p.showSalary
        }));
    }

    // Function to show salary popup
    function showSalaryPopup(event, position) {
        event.stopPropagation(); // Prevent event bubbling
        activeSalaryPopup = position.id;
        
        // Hide popup when clicking outside
        const handleClickOutside = (e) => {
            if (!e.target.closest('.salary-popup')) {
                activeSalaryPopup = null;
                document.removeEventListener('click', handleClickOutside);
            }
        };
        
        // Add listener on next tick to avoid immediate trigger
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
    }

    // Function to show status menu
    function showStatusMenu(event, position) {
        event.stopPropagation(); // Prevent event bubbling
        activeStatusMenu = position.id;
        
        // Hide menu when clicking outside
        const handleClickOutside = (e) => {
            if (!e.target.closest('.status-menu')) {
                activeStatusMenu = null;
                document.removeEventListener('click', handleClickOutside);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
    }

    // Sort positions by creation date (newest first)
    $effect(() => {
        if (positions.length > 0) {
            const currentPositions = untrack(() => [...positions]);
            const sortedPositions = currentPositions.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // Only update if the order has changed
            if (JSON.stringify(positions) !== JSON.stringify(sortedPositions)) {
                positions = sortedPositions;
            }
        }
    });
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
            <div class="col-12 col-lg-4 col-xl-3 {showAddForm ? 'mb-4' : ''}" transition:slide={{ duration: 300 }}>
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
                                            <option value="">&nbsp;&nbsp;Select department</option>
                                            {#each DEPARTMENTS as department}
                                                <option value={department}>&nbsp;&nbsp;{department}</option>
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
                                            <option value="">&nbsp;&nbsp;Select timeline</option>
                                            {#each TIMELINES as timeline}
                                                <option value={timeline}>&nbsp;&nbsp;{timeline}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="input-group">
                                        <input 
                                            type="number" 
                                            class="form-control"
                                            bind:value={newPosition.payRange.min}
                                            placeholder="Min ($)"
                                            required
                                        />
                                        <span class="input-group-text">to</span>
                                        <input 
                                            type="number" 
                                            class="form-control"
                                            bind:value={newPosition.payRange.max}
                                            placeholder="Max ($)"
                                            required
                                        />
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="d-flex justify-content-end gap-2">
                                        <button type="button" class="btn btn-secondary d-flex align-items-center justify-content-center" style="width: 100px;" onclick={() => { resetForm(); showAddForm = false; }}>
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary d-flex align-items-center justify-content-center" style="width: 100px;" disabled={isSubmitting}>
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
                        {#if isLoading}
                            {#each Array(3) as _, i}
                                <div class="card mb-3" in:fade>
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <div style="width: 60%;">
                                                <div class="skeleton-line" style="width: 40%; height: 24px;"></div>
                                                <div class="mt-2">
                                                    <div class="skeleton-line" style="width: 70%; height: 16px;"></div>
                                                    <div class="skeleton-line mt-2" style="width: 50%; height: 16px;"></div>
                                                </div>
                                            </div>
                                            <div style="width: 30%;">
                                                <div class="skeleton-line" style="width: 100%; height: 32px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {:else if positions.length === 0}
                            <div class="text-center text-muted py-5">
                                <i class="bi bi-briefcase display-4"></i>
                                <p class="mt-2">No positions found</p>
                            </div>
                        {:else}
                            {#each positions as position}
                                <div class="card mb-3" in:fade>
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h5 class="card-title mb-1">{position.title}</h5>
                                                <div class="d-flex align-items-center text-muted small mb-1">
                                                    <i class="bi bi-building me-2"></i>
                                                    <span>{position.department}</span>
                                                </div>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <button 
                                                    class="btn btn-info btn-sm text-white"
                                                    title="Timeline"
                                                    disabled
                                                >
                                                    {position.timeline}
                                                </button>
                                                <button 
                                                    class="btn btn-outline-success btn-sm"
                                                    onclick={(e) => showSalaryPopup(e, position)}
                                                    aria-label="Show salary range"
                                                >
                                                    <i class="bi bi-cash"></i>
                                                </button>
                                                {#if activeSalaryPopup === position.id}
                                                    <div class="salary-popup position-absolute bg-dark text-white p-2 rounded" style="top: -40px; right: 0; z-index: 1000;">
                                                        ${position.payRange?.min?.toLocaleString() || 0} - ${position.payRange?.max?.toLocaleString() || 0}
                                                    </div>
                                                {/if}
                                                <button 
                                                    class="btn btn-outline-danger btn-sm"
                                                    onclick={() => deletePosition(position.id)}
                                                    title="Delete position"
                                                    aria-label="Delete {position.title}"
                                                >
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="d-flex align-items-center text-muted small">
                                            <i class="bi bi-person me-2"></i>
                                            <span>{position.hiringManager}</span>
                                        </div>

                                        <hr class="my-2">
                                        
                                        <div class="d-flex justify-content-between align-items-center text-muted small">
                                            <!-- Position State -->
                                            <div class="d-flex align-items-center position-relative">
                                                <button 
                                                    class="btn btn-link btn-sm p-0 text-decoration-none {STATES[position.state]?.class || 'text-primary'}"
                                                    onclick={(e) => showStatusMenu(e, position)}
                                                    style="font-size: inherit;"
                                                >
                                                    <div class="d-flex align-items-center">
                                                        <i class="bi bi-circle-fill me-2" style="font-size: 8px; transform: translateY(1px);"></i>
                                                        <span>{STATES[position.state]?.label || 'Open'}</span>
                                                        <i class="bi bi-chevron-down ms-1" style="font-size: 0.75em;"></i>
                                                    </div>
                                                </button>
                                                
                                                {#if activeStatusMenu === position.id}
                                                    <div class="status-menu position-absolute bg-white border rounded shadow-sm py-1" style="top: 100%; left: 0; z-index: 1000; min-width: 120px; margin-top: 4px;">
                                                        {#each Object.entries(STATES) as [state, { label, class: className }]}
                                                            <button 
                                                                class="btn btn-link btn-sm w-100 text-start text-decoration-none {className}"
                                                                onclick={() => updatePositionState(position, state)}
                                                                style="font-size: inherit;"
                                                            >
                                                                <div class="d-flex align-items-center">
                                                                    <i class="bi bi-circle-fill me-2" style="font-size: 8px; transform: translateY(1px);"></i>
                                                                    {label}
                                                                </div>
                                                            </button>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>

                                            <!-- Candidates Progress -->
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="d-flex align-items-center" title="Total candidates">
                                                    <i class="bi bi-people me-1"></i>
                                                    <span>{candidateCounts[position.id]?.total || 0}</span>
                                                </div>
                                                <div class="vr"></div>
                                                <div class="d-flex align-items-center gap-2">
                                                    <span title="CV Review" class="d-flex align-items-center">
                                                        <i class="bi bi-file-text me-1"></i>
                                                        {candidateCounts[position.id]?.stages?.cv_review || 0}
                                                    </span>
                                                    <span title="Culture Fit" class="d-flex align-items-center">
                                                        <i class="bi bi-person-check me-1"></i>
                                                        {candidateCounts[position.id]?.stages?.culture_fit || 0}
                                                    </span>
                                                    <span title="Interview" class="d-flex align-items-center">
                                                        <i class="bi bi-code-square me-1"></i>
                                                        {candidateCounts[position.id]?.stages?.interview || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .skeleton-line {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
    }

    @keyframes loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }

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

    .salary-popup {
        font-size: 0.875rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .status-menu button {
        padding: 0.25rem 1rem;
    }

    .status-menu button:hover {
        background-color: #f8f9fa;
    }
</style> 