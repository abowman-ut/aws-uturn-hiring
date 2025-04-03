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
    let selectedFilter = $state('all');
    let selectedTimeline = $state('All');
    let selectedDepartment = $state('All');
    let showFilters = $state(false);
    let searchQuery = $state('');

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
    const DEPARTMENT_OPTIONS = ['All', ...DEPARTMENTS];
    const TIMELINES = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];

    // Update state options
    const STATES = {
        'all': { label: 'All', class: 'text-secondary', icon: 'bi-grid', bgClass: 'bg-light-secondary' },
        'open': { label: 'Open', class: 'text-primary', icon: 'bi-circle-fill', bgClass: 'bg-light-primary' },
        'on_hold': { label: 'On Hold', class: 'text-warning', icon: 'bi-pause-circle-fill', bgClass: 'bg-light-warning' },
        'cancelled': { label: 'Cancelled', class: 'text-danger', icon: 'bi-x-circle-fill', bgClass: 'bg-light-danger' },
        'filled': { label: 'Filled', class: 'text-success', icon: 'bi-check-circle-fill', bgClass: 'bg-light-success' }
    };

    // Add state for salary popup
    let activeSalaryPopup = $state(null);

    // Add state for status menu
    let activeStatusMenu = $state(null);

    // Add state for candidate counts
    let candidateCounts = $state({});

    // Add state for dropdowns
    let activeDropdown = $state(null);

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
        let filtered = positions;
        
        // Filter by state
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(position => position.state === selectedFilter);
        }
        
        // Filter by timeline
        if (selectedTimeline !== 'All') {
            filtered = filtered.filter(position => position.timeline === selectedTimeline);
        }

        // Filter by department
        if (selectedDepartment !== 'All') {
            filtered = filtered.filter(position => position.department === selectedDepartment);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(position => 
                position.title.toLowerCase().includes(query) ||
                position.department.toLowerCase().includes(query) ||
                position.hiringManager.toLowerCase().includes(query)
            );
        }
        
        return filtered;
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

            // Reset form and hide it
            resetForm();
            showAddForm = false;
            
            // Reload data to get the updated list
            await loadData();
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
        event.stopPropagation();
        // Initialize popover if not already initialized
        const button = event.currentTarget;
        if (!button._popover) {
            button._popover = new bootstrap.Popover(button, {
                trigger: 'click',
                placement: 'top',
                html: true
            });
        }
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

    function toggleFilters() {
        showFilters = !showFilters;
    }

    // Function to handle dropdown selection
    function handleDropdownSelect(dropdown, value) {
        if (dropdown === 'department') {
            selectedDepartment = value;
        } else if (dropdown === 'timeline') {
            selectedTimeline = value;
        }
        activeDropdown = null; // Close the dropdown
    }

    // Function to toggle dropdown
    function toggleDropdown(dropdown) {
        activeDropdown = activeDropdown === dropdown ? null : dropdown;
    }
</script>

<div class="container-fluid py-3">
    <div class="row">
        <!-- Add Position Button and Filter (visible on mobile) -->
        <div class="col-12 d-lg-none mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <div class="btn-group" role="group" aria-label="Position filters">
                        {#each Object.entries(STATES) as [state, { label, class: className, icon }]}
                            <button 
                                type="button" 
                                class="btn btn-outline-secondary {selectedFilter === state ? 'active' : ''}"
                                onclick={() => selectedFilter = state}
                                title={label}
                            >
                                <i class="bi {icon} {className}"></i>
                                <span class="ms-1 d-none d-sm-inline">{label}</span>
                            </button>
                        {/each}
                    </div>
                </div>
                <div class="d-flex flex-column align-items-end">
                    <button 
                        type="button" 
                        class="btn btn-primary d-inline-flex align-items-center" 
                        onclick={() => showAddForm = !showAddForm}
                        disabled={showAddForm}
                    >
                        <i class="bi bi-{showAddForm ? 'dash' : 'plus'}-circle"></i>
                        <span class="ms-2 d-none d-sm-inline">Add Position</span>
                    </button>
                    
                    <!-- Position count - only shown when filters are visible -->
                    {#if showFilters}
                        <div class="d-flex align-items-center text-muted small text-end mt-3" transition:slide={{ duration: 200 }}>
                            Showing {getFilteredPositions().length} of {positions.length} positions
                        </div>
                    {/if}
                </div>
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
                                            {#each DEPARTMENT_OPTIONS as department}
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
                                        <i class="bi bi-calendar3 select-icon"></i>
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
                                        />
                                        <span class="input-group-text">to</span>
                                        <input 
                                            type="number" 
                                            class="form-control"
                                            bind:value={newPosition.payRange.max}
                                            placeholder="Max ($)"
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
                    <!-- Desktop Filter and Add Position Button -->
                    <div class="d-none d-lg-flex justify-content-between align-items-start mb-4">
                        <div class="d-flex flex-column gap-2">
                            <div class="d-flex align-items-center">
                                <button 
                                    type="button" 
                                    class="btn btn-outline-secondary me-2"
                                    title="Filters"
                                    onclick={toggleFilters}
                                >
                                    <span>Filters</span>
                                    <i class="bi bi-chevron-{showFilters ? 'up' : 'down'} ms-1"></i>
                                </button>
                                <div class="btn-group" role="group" aria-label="Position filters">
                                    {#each Object.entries(STATES) as [state, { label, class: className, icon, bgClass }]}
                                        <button 
                                            type="button" 
                                            class="btn btn-outline-secondary {selectedFilter === state ? `active ${bgClass}` : ''}"
                                            onclick={() => selectedFilter = state}
                                            title={label}
                                        >
                                            <i class="bi {icon} {className}"></i>
                                            <span class="ms-1 text-secondary">{label}</span>
                                        </button>
                                    {/each}
                                </div>
                            </div>

                            {#if showFilters}
                                <div class="d-flex gap-2" transition:slide={{ duration: 200 }}>
                                    <!-- Department filter dropdown -->
                                    <div class="dropdown">
                                        <button 
                                            class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 {selectedDepartment !== 'All' ? 'active' : ''}" 
                                            type="button" 
                                            onclick={() => toggleDropdown('department')}
                                            aria-expanded={activeDropdown === 'department'}
                                        >
                                            <i class="bi bi-building"></i>
                                            <span>{selectedDepartment === 'All' ? 'Department' : selectedDepartment}</span>
                                        </button>
                                        {#if activeDropdown === 'department'}
                                            <ul class="dropdown-menu show">
                                                {#each DEPARTMENT_OPTIONS as department}
                                                    <li>
                                                        <button 
                                                            class="dropdown-item {selectedDepartment === department ? 'active' : ''}" 
                                                            onclick={() => handleDropdownSelect('department', department)}
                                                        >
                                                            {department}
                                                        </button>
                                                    </li>
                                                {/each}
                                            </ul>
                                        {/if}
                                    </div>

                                    <!-- Timeline filter dropdown -->
                                    <div class="dropdown">
                                        <button 
                                            class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 {selectedTimeline !== 'All' ? 'active' : ''}" 
                                            type="button" 
                                            onclick={() => toggleDropdown('timeline')}
                                            aria-expanded={activeDropdown === 'timeline'}
                                        >
                                            <i class="bi bi-calendar3"></i>
                                            <span>{selectedTimeline === 'All' ? 'Timeline' : selectedTimeline}</span>
                                        </button>
                                        {#if activeDropdown === 'timeline'}
                                            <ul class="dropdown-menu show">
                                                {#each TIMELINES as timeline}
                                                    <li>
                                                        <button 
                                                            class="dropdown-item {selectedTimeline === timeline ? 'active' : ''}" 
                                                            onclick={() => handleDropdownSelect('timeline', timeline)}
                                                        >
                                                            {timeline}
                                                        </button>
                                                    </li>
                                                {/each}
                                            </ul>
                                        {/if}
                                    </div>

                                    <!-- Search bar -->
                                    <div class="position-relative search-container">
                                        <input
                                            type="text"
                                            class="form-control form-control-sm pe-4"
                                            placeholder=""
                                            bind:value={searchQuery}
                                        />
                                        <i class="bi bi-search position-absolute top-50 translate-middle-y end-0 me-2 text-gray-500" style="font-size: 0.75rem;"></i>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <div class="d-flex flex-column align-items-end">
                            <button 
                                type="button" 
                                class="btn btn-primary d-inline-flex align-items-center d-lg-none" 
                                onclick={() => showAddForm = !showAddForm}
                                disabled={showAddForm}
                            >
                                <i class="bi bi-{showAddForm ? 'dash' : 'plus'}-circle"></i>
                                <span class="ms-2 d-none d-sm-inline">Add Position</span>
                            </button>
                            
                            <!-- Position count - only shown when filters are visible -->
                            {#if showFilters}
                                <div class="d-flex align-items-center text-muted small text-end mt-3" transition:slide={{ duration: 200 }}>
                                    Showing {getFilteredPositions().length} of {positions.length} positions
                                </div>
                            {/if}
                        </div>
                    </div>

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
                            {#each getFilteredPositions() as position}
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
                                                {#if position.payRange?.min > 0 || position.payRange?.max > 0}
                                                    <button 
                                                        class="btn btn-outline-success btn-sm"
                                                        onclick={(e) => showSalaryPopup(e, position)}
                                                        aria-label="Show salary range"
                                                        data-bs-toggle="popover"
                                                        data-bs-placement="top"
                                                        data-bs-content="${position.payRange?.min?.toLocaleString() || 0} - ${position.payRange?.max?.toLocaleString() || 0}"
                                                        data-bs-trigger="click"
                                                    >
                                                        <i class="bi bi-cash"></i>
                                                    </button>
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
                                                        {#each Object.entries(STATES).filter(([key]) => key !== 'all') as [state, { label, class: className }]}
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

    .btn-group .btn {
        border-radius: 0;
        transition: all 0.2s ease;
    }

    .btn-group .btn:first-child {
        border-top-left-radius: 0.375rem;
        border-bottom-left-radius: 0.375rem;
    }

    .btn-group .btn:last-child {
        border-top-right-radius: 0.375rem;
        border-bottom-right-radius: 0.375rem;
    }

    .btn-group .btn.active {
        background-color: transparent;
    }

    .btn-group .btn.active.bg-light-primary {
        background-color: rgba(13, 110, 253, 0.1);
    }

    .btn-group .btn.active.bg-light-secondary {
        background-color: rgba(108, 117, 125, 0.1);
    }

    .btn-group .btn.active.bg-light-success {
        background-color: rgba(25, 135, 84, 0.1);
    }

    .btn-group .btn.active.bg-light-danger {
        background-color: rgba(220, 53, 69, 0.1);
    }

    .btn-group .btn.active.bg-light-warning {
        background-color: rgba(255, 193, 7, 0.1);
    }

    .btn-group .btn i {
        font-size: 0.875rem;
    }

    .btn-group .btn.active .text-secondary {
        color: #6c757d !important;
    }

    .btn-group .btn:hover {
        background-color: rgba(108, 117, 125, 0.05);
    }

    /* Add these styles to match the screenshot */
    .dropdown-toggle::after {
        margin-left: 0.5rem;
    }
    
    .dropdown-menu {
        min-width: 8rem;
    }
    
    .dropdown-item.active {
        background-color: var(--bs-primary);
        color: white;
    }
    
    .btn-group .btn.selected {
        background-color: var(--bs-light);
        border-color: var(--bs-gray-300);
    }

    /* Update hover states for filter buttons */
    .btn-outline-secondary:hover {
        background-color: rgba(108, 117, 125, 0.04) !important;
        color: #6c757d;
    }

    /* Keep dropdown items hover state */
    .dropdown-item:hover {
        background-color: rgba(108, 117, 125, 0.15);
        color: inherit;
    }

    /* Specific hover state for dropdown buttons */
    .dropdown .btn-outline-secondary:hover,
    /* .dropdown .btn-outline-secondary[aria-expanded="true"], */
    .dropdown .btn-outline-secondary.active {
        background-color: rgba(108, 117, 125, 0.04) !important;
        color: #6c757d;
    }

    /* Update search bar styles */
    .search-container {
        flex: 1;
        max-width: 300px;
    }

    .search-container input {
        border: 1px solid #6c757d;
    }

    .search-container input:focus {
        border-color: #6c757d;
        box-shadow: 0 0 0 0.2rem rgba(108, 117, 125, 0.15);
    }

    .text-gray-500 {
        color: #adb5bd !important;
    }

    /* Ensure dropdown menu is positioned correctly */
    .dropdown-menu {
        position: absolute;
        z-index: 1000;
    }

    /* Add transition for smooth dropdown appearance */
    .dropdown-menu {
        transition: all 0.2s ease;
    }

    /* Add a nice hover effect to the salary button */
    .btn-outline-success:hover {
        background-color: rgba(25, 135, 84, 0.1);
    }
    .btn-outline-success:hover i {
        color: var(--bs-success) !important;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style> 