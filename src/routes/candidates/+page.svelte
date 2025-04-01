<script>
    import { base } from '$app/paths';
    import HiringTimeline from '$lib/components/HiringTimeline.svelte';
    import StageProgress from '$lib/components/StageProgress.svelte';
    import { slide } from 'svelte/transition';
    let title = $state('Candidates');
    let pageTitle = $derived(title);
    let candidates = $state([]);
    let positions = $state([]);
    let showAddForm = $state(false);
    let isSubmitting = $state(false);
    let formError = $state(null);
    let showTimelines = $state({});  // Store visibility state for each candidate
    let isLoading = $state(true);  // Add loading state
    let activeSalaryPopup = $state(null);  // Add state for salary popup

    // Form data
    let newCandidate = $state({
        name: '',
        email: '',
        status: 'cv_review',
        positionId: '',
        expectedPayRange: {
            min: '',
            max: '',
            currency: 'USD'
        },
        source: '',
        sourceName: ''
    });

    const STAGES = [
        { id: 'cv_review', name: 'CV Review', icon: 'bi-file-text' },
        { id: 'culture_fit', name: 'Culture Fit', icon: 'bi-person-check' },
        { id: 'interview', name: 'Interview', icon: 'bi-code-square' }
    ];

    // Load data when component mounts
    $effect(() => {
        loadData();
    });

    async function loadData() {
        isLoading = true;
        try {
            const [positionsRes, candidatesRes] = await Promise.all([
                fetch('/api/positions'),
                fetch('/api/candidates')
            ]);

            if (!positionsRes.ok) throw new Error('Failed to load positions');
            if (!candidatesRes.ok) throw new Error('Failed to load candidates');

            positions = await positionsRes.json();
            const loadedCandidates = await candidatesRes.json();
            
            // Sort candidates by createdAt in descending order (newest first)
            candidates = loadedCandidates.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            isLoading = false;
        }
    }

    // Helper function to get position title
    function getPositionTitle(positionId) {
        return positions.find(p => p.id === positionId)?.title || 'Unknown Position';
    }

    // Helper function to format pay range
    function formatPayRange({ min, max, currency = 'USD' } = {}) {
        return min && max ? `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}` : 'Not specified';
    }

    // Helper function to format source
    function formatSource(source, sourceName) {
        return source && sourceName ? `${source.charAt(0).toUpperCase() + source.slice(1)}: ${sourceName}` : 'Not specified';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        isSubmitting = true;
        formError = null;

        try {
            const response = await fetch('/api/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCandidate)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create candidate');
            }

            candidates = [await response.json(), ...candidates];
            showAddForm = false;
            resetForm();
        } catch (error) {
            formError = error.message;
        } finally {
            isSubmitting = false;
        }
    }

    async function deleteCandidate(id) {
        if (!confirm('Are you sure you want to delete this candidate?')) return;
        
        try {
            const response = await fetch(`/api/candidates?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete candidate');
            }

            candidates = candidates.filter(c => c.id !== id);
        } catch (error) {
            console.error('Error deleting candidate:', error);
            formError = error.message;
        }
    }

    function resetForm() {
        newCandidate = {
            name: '',
            email: '',
            status: 'cv_review',
            positionId: '',
            expectedPayRange: { min: '', max: '', currency: 'USD' },
            source: '',
            sourceName: ''
        };
        showAddForm = false;
    }

    function updateCandidate(updatedCandidate) {
        candidates = candidates.map(c => 
            c.id === updatedCandidate.id ? updatedCandidate : c
        );
    }

    // Function to show salary popup
    function showSalaryPopup(event, candidate) {
        event.stopPropagation(); // Prevent event bubbling
        activeSalaryPopup = candidate.id;
        
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
</script>

<div class="container-fluid py-3">
    <div class="row">
        <!-- Sidebar (visible on lg screens) -->
        <div class="d-none d-lg-block col-lg-4 col-xl-3">
            <div class="card">
                <div class="card-body">
                    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
                        <div class="row g-3">
                            <div class="col-12">
                                <div class="select-wrapper">
                                    <i class="bi bi-list-ul select-icon"></i>
                                    <select class="form-select ps-4" bind:value={newCandidate.positionId} required>
                                        <option value="">&nbsp;&nbsp;Position</option>
                                        {#each positions as position}
                                            <option value={position.id}>&nbsp;&nbsp;{position.title}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>

                            <div class="col-12">
                                <input 
                                    type="text" 
                                    class="form-control"
                                    bind:value={newCandidate.name}
                                    placeholder="Name"
                                    required
                                />
                            </div>

                            <div class="col-12">
                                <input 
                                    type="email" 
                                    class="form-control"
                                    bind:value={newCandidate.email}
                                    placeholder="Email"
                                    required
                                />
                            </div>

                            <div class="col-12">
                                <div class="select-wrapper">
                                    <i class="bi bi-person-bounding-box select-icon"></i>
                                    <select class="form-select ps-4" bind:value={newCandidate.source} required>
                                        <option value="">&nbsp;&nbsp;Source</option>
                                        <option value="recruiter">&nbsp;&nbsp;Recruiter</option>
                                        <option value="referral">&nbsp;&nbsp;Referral</option>
                                    </select>
                                </div>
                            </div>

                            <div class="col-12">
                                <input 
                                    type="text" 
                                    class="form-control"
                                    bind:value={newCandidate.sourceName}
                                    placeholder="Source Contact"
                                    required
                                />
                            </div>

                            <div class="col-12">
                                <div class="input-group">
                                    <input 
                                        type="number" 
                                        class="form-control"
                                        bind:value={newCandidate.expectedPayRange.min}
                                        placeholder="Min ($)"
                                        required
                                    />
                                    <span class="input-group-text">to</span>
                                    <input 
                                        type="number" 
                                        class="form-control"
                                        bind:value={newCandidate.expectedPayRange.max}
                                        placeholder="Max ($)"
                                        required
                                    />
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
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="col-12 col-lg-8 col-xl-9">
            <div class="d-flex justify-content-end mb-3 d-lg-none">
                <button 
                    type="button" 
                    class="btn btn-primary" 
                    onclick={() => showAddForm = !showAddForm}
                    disabled={showAddForm}
                    aria-label={showAddForm ? 'Hide add candidate form' : 'Show add candidate form'}
                >
                    <i class="bi bi-{showAddForm ? 'dash' : 'plus'}-circle me-2"></i>
                    Add Candidate
                </button>
            </div>

            <!-- Mobile Form (visible on smaller screens) -->
            <div class="d-lg-none">
                {#if showAddForm}
                    <div class="card mb-3" transition:slide={{ duration: 200 }}>
                        <div class="card-body">
                            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="select-wrapper">
                                            <i class="bi bi-list-ul select-icon"></i>
                                            <select class="form-select ps-4" bind:value={newCandidate.positionId} required>
                                                <option value="">&nbsp;&nbsp;Position</option>
                                                {#each positions as position}
                                                    <option value={position.id}>&nbsp;&nbsp;{position.title}</option>
                                                {/each}
                                            </select>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <input 
                                            type="text" 
                                            class="form-control"
                                            bind:value={newCandidate.name}
                                            placeholder="Name"
                                            required
                                        />
                                    </div>

                                    <div class="col-md-6">
                                        <input 
                                            type="email" 
                                            class="form-control"
                                            bind:value={newCandidate.email}
                                            placeholder="Email"
                                            required
                                        />
                                    </div>

                                    <div class="col-md-6">
                                        <div class="select-wrapper">
                                            <i class="bi bi-person-bounding-box select-icon"></i>
                                            <select class="form-select ps-4" bind:value={newCandidate.source} required>
                                                <option value="">&nbsp;&nbsp;Source</option>
                                                <option value="recruiter">&nbsp;&nbsp;Recruiter</option>
                                                <option value="referral">&nbsp;&nbsp;Referral</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <input 
                                            type="text" 
                                            class="form-control"
                                            bind:value={newCandidate.sourceName}
                                            placeholder="Source Contact"
                                            required
                                        />
                                    </div>

                                    <div class="col-md-6">
                                        <div class="input-group">
                                            <input 
                                                type="number" 
                                                class="form-control"
                                                bind:value={newCandidate.expectedPayRange.min}
                                                placeholder="Min ($)"
                                                required
                                            />
                                            <span class="input-group-text">to</span>
                                            <input 
                                                type="number" 
                                                class="form-control"
                                                bind:value={newCandidate.expectedPayRange.max}
                                                placeholder="Max ($)"
                                                required
                                            />
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
                                </div>
                            </form>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="card">
                <div class="card-body">
                    <!-- Candidates List -->
                    <div class="candidates-list">
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
                                            <div style="width: 35%;">
                                                <div class="skeleton-line" style="width: 100%; height: 16px;"></div>
                                                <div class="skeleton-line mt-3" style="width: 100%; height: 20px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {:else if candidates.length === 0}
                            <div class="text-center text-muted py-5">
                                <i class="bi bi-people display-4"></i>
                                <p class="mt-2">No candidates found</p>
                            </div>
                        {:else}
                            {#each candidates as candidate}
                                <div class="card mb-3" in:fade>
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h5 class="card-title mb-1">{candidate.name}</h5>
                                                <div class="mt-1">
                                                    <div class="d-flex align-items-center text-muted small mb-1">
                                                        <i class="bi bi-briefcase me-2"></i>
                                                        <span>{getPositionTitle(candidate.positionId)}</span>
                                                    </div>                                                    
                                                    <div class="d-flex align-items-center text-muted small mb-1">
                                                        <i class="bi bi-envelope me-2"></i>
                                                        <span>{candidate.email}</span>
                                                    </div>
                                                    <div class="d-flex align-items-center text-muted small mt-1">
                                                        <i class="bi bi-person-bounding-box me-2"></i>
                                                        <span>{formatSource(candidate.source, candidate.sourceName)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="d-flex flex-column align-items-end">
                                                <div class="d-flex gap-2">
                                                    <button 
                                                        class="btn btn-outline-success btn-sm"
                                                        onclick={(e) => showSalaryPopup(e, candidate)}
                                                        aria-label="Show salary range"
                                                    >
                                                        <i class="bi bi-cash"></i>
                                                    </button>
                                                    {#if activeSalaryPopup === candidate.id}
                                                        <div class="salary-popup position-absolute bg-dark text-white p-2 rounded" style="top: -40px; right: 0; z-index: 1000;">
                                                            ${candidate.expectedPayRange?.min?.toLocaleString() || 0} - ${candidate.expectedPayRange?.max?.toLocaleString() || 0}
                                                        </div>
                                                    {/if}
                                                    <button 
                                                        class="btn btn-outline-danger btn-sm"
                                                        onclick={() => deleteCandidate(candidate.id)}
                                                        title="Delete candidate"
                                                        aria-label="Delete {candidate.name}"
                                                    >
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                                <div class="d-flex align-items-center gap-3 mt-2 d-none d-lg-flex">
                                                    <StageProgress candidate={candidate} />
                                                    <button 
                                                        class="btn btn-link p-0 text-muted fw-bold"
                                                        onclick={() => showTimelines[candidate.id] = !showTimelines[candidate.id]}
                                                        aria-label="Toggle timeline"
                                                    >
                                                        <i class="bi bi-chevron-{showTimelines[candidate.id] ? 'up' : 'down'} fw-bold"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-end align-items-center gap-3 mt-2 d-lg-none">
                                            <StageProgress candidate={candidate} />
                                            <button 
                                                class="btn btn-link p-0 text-muted fw-bold"
                                                onclick={() => showTimelines[candidate.id] = !showTimelines[candidate.id]}
                                                aria-label="Toggle timeline"
                                            >
                                                <i class="bi bi-chevron-{showTimelines[candidate.id] ? 'up' : 'down'} fw-bold"></i>
                                            </button>
                                        </div>

                                        {#if showTimelines[candidate.id]}
                                            <div class="border-top pt-3 mt-3" transition:slide={{ duration: 300 }}>
                                                <HiringTimeline 
                                                    candidate={candidate} 
                                                    onUpdate={updateCandidate}
                                                />
                                            </div>
                                        {/if}
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
</style> 