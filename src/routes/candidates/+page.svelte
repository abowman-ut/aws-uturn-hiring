<script>
    import { base } from '$app/paths';
    import HiringTimeline from '$lib/components/HiringTimeline.svelte';
    import { slide } from 'svelte/transition';
    let title = $state('Candidates');
    let pageTitle = $derived(title);
    let candidates = $state([]);
    let positions = $state([]);
    let showAddForm = $state(false);
    let isSubmitting = $state(false);
    let formError = $state(null);
    let formSuccess = $state(null);
    let selectedPosition = $state('');
    let selectedSource = $state('');
    let showFilters = $state(true);

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
        { id: 'culture_fit', name: 'Culture Fit', icon: 'bi-people' },
        { id: 'interview', name: 'Interview', icon: 'bi-code-square' }
    ];

    // Load data when component mounts
    $effect(() => {
        loadData();
    });

    async function loadData() {
        try {
            const [positionsRes, candidatesRes] = await Promise.all([
                fetch('/api/positions'),
                fetch('/api/candidates')
            ]);

            if (!positionsRes.ok) throw new Error('Failed to load positions');
            if (!candidatesRes.ok) throw new Error('Failed to load candidates');

            positions = await positionsRes.json();
            candidates = await candidatesRes.json();
        } catch (error) {
            console.error('Error loading data:', error);
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

    // Helper function to get filtered candidates
    function getFilteredCandidates() {
        return candidates.filter(candidate => 
            (!selectedPosition || candidate.positionId === selectedPosition) &&
            (!selectedSource || candidate.source === selectedSource)
        );
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

            candidates = [...candidates, await response.json()];
            formSuccess = 'Candidate added successfully!';
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
            formSuccess = 'Candidate deleted successfully!';
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
    }
</script>

<div class="page-layout">
    <!-- Sidebar with entry form -->
    <div class="sidebar">
        <!-- Add Candidate Form -->
        <div class="add-candidate-section">
            <h3>Add New Candidate</h3>
            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
                <div class="mb-3">
                    <select class="form-select" bind:value={newCandidate.positionId} required>
                        <option value="">Position</option>
                        {#each positions as position}
                            <option value={position.id}>{position.title}</option>
                        {/each}
                    </select>
                </div>

                <div class="mb-3">
                    <input 
                        type="text" 
                        class="form-control"
                        bind:value={newCandidate.name}
                        placeholder="Name"
                        required
                    />
                </div>

                <div class="mb-3">
                    <input 
                        type="email" 
                        class="form-control"
                        bind:value={newCandidate.email}
                        placeholder="Email"
                        required
                    />
                </div>

                <div class="mb-3">
                    <select class="form-select" bind:value={newCandidate.source} required>
                        <option value="">Source</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="referral">Referral</option>
                    </select>
                </div>

                <div class="mb-3">
                    <input 
                        type="text" 
                        class="form-control"
                        bind:value={newCandidate.sourceName}
                        placeholder="Source Contact"
                        required
                    />
                </div>

                <div class="mb-3">
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
                        <i class="bi bi-exclamation-circle-fill"></i>
                        {formError}
                    </div>
                {/if}

                {#if formSuccess}
                    <div class="alert alert-success mt-3">
                        <i class="bi bi-check-circle-fill"></i>
                        {formSuccess}
                    </div>
                {/if}
            </form>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <div class="content-card">
            <!-- Filters Toggle -->
            <div class="filters-toggle" onclick={() => showFilters = !showFilters}>
                <i class="bi bi-filter-circle-fill"></i>
                <span>Filters</span>
                <i class="bi bi-chevron-{showFilters ? 'up' : 'down'}"></i>
            </div>

            <!-- Filters Section with Transition -->
            {#if showFilters}
                <div class="filters-section" transition:slide={{ duration: 200 }}>
                    <div class="filters">
                        <div class="filter-group">
                            <label>Position</label>
                            <select bind:value={selectedPosition}>
                                <option value="">All Positions</option>
                                {#each positions as position}
                                    <option value={position.id}>{position.title}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Source</label>
                            <select bind:value={selectedSource}>
                                <option value="">All Sources</option>
                                <option value="recruiter">Recruiter</option>
                                <option value="referral">Referral</option>
                            </select>
                        </div>
                    </div>
                </div>
            {/if}

            <div class="candidates-count">
                Showing {getFilteredCandidates().length} of {candidates.length} candidates
            </div>

            <!-- Candidates List -->
            <div class="candidates-list">
                {#if getFilteredCandidates().length === 0}
                    <div class="empty-state">
                        <i class="bi bi-people"></i>
                        <span>No candidates found</span>
                    </div>
                {:else}
                    {#each getFilteredCandidates() as candidate}
                        <div class="candidate-card">
                            <div class="candidate-header">
                                <div class="candidate-title">
                                    <h3>{candidate.name}</h3>
                                    <span class="status-badge {candidate.status}">{candidate.status}</span>
                                </div>
                                <div class="candidate-actions">
                                    <span class="position-tag">
                                        <i class="bi bi-briefcase"></i>
                                        {getPositionTitle(candidate.positionId)}
                                    </span>
                                    <button 
                                        class="btn-delete" 
                                        onclick={() => deleteCandidate(candidate.id)}
                                        title="Delete candidate"
                                        aria-label="Delete candidate"
                                    >
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="candidate-details">
                                <div class="detail-group">
                                    <i class="bi bi-envelope"></i>
                                    <span>{candidate.email}</span>
                                </div>
                                <div class="detail-group">
                                    <i class="bi bi-cash"></i>
                                    <span>{formatPayRange(candidate.expectedPayRange)}</span>
                                </div>
                                <div class="detail-group">
                                    <i class="bi bi-person-badge"></i>
                                    <span>{formatSource(candidate.source, candidate.sourceName)}</span>
                                </div>
                            </div>

                            <!-- Add Hiring Timeline -->
                            <div class="timeline-section">
                                <HiringTimeline {candidate} />
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .page-layout {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 1rem;
        padding: 1rem 0;
        height: 100%;
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .filters-section, .add-candidate-section {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .filters-section h3, .add-candidate-section h3 {
        color: #1e293b;
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .filters {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .filter-group label {
        font-size: 0.875rem;
        color: #64748b;
    }

    .form-group input, .form-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        background-color: white;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1rem;
        padding-right: 2.5rem;
    }

    .form-group select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .pay-range {
        margin-bottom: 1.5rem;
    }

    .pay-range-inputs {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .pay-range-inputs input {
        flex: 1;
    }

    .pay-range-inputs span {
        color: #64748b;
    }

    .form-actions {
        display: flex;
        gap: 0.75rem;
    }

    .main-content {
        min-width: 0;
    }

    @media (max-width: 768px) {
        .page-layout {
            grid-template-columns: 1fr;
        }
    }

    .content-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .header i {
        font-size: 1.5rem;
    }

    h1 {
        color: #1e293b;
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0;
    }

    .form-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    .form-card h2 {
        color: #1e293b;
        font-size: 1.25rem;
        margin-bottom: 1.5rem;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .form-group.full-width {
        grid-column: 1 / -1;
    }

    label {
        color: #475569;
        font-size: 0.875rem;
        font-weight: 500;
    }

    input, select, textarea {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
    }

    .alert {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 6px;
        margin: 1rem 0;
        font-size: 0.875rem;
    }

    .alert-error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
    }

    .alert-success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
    }

    .candidates-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .candidate-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
    }

    .candidate-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    .candidate-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .candidate-title h3 {
        margin: 0;
        color: #1e293b;
        font-size: 1.25rem;
    }

    .candidate-meta {
        display: flex;
        gap: 0.75rem;
    }

    .position-tag {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #64748b;
        font-size: 0.875rem;
    }

    .candidate-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .detail-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
    }

    .candidate-resume {
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }

    .candidate-resume h4 {
        color: #1e293b;
        font-size: 1rem;
        margin-bottom: 0.5rem;
    }

    .candidate-resume p {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0;
        white-space: pre-wrap;
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
    }

    .status-badge.new {
        background: #dbeafe;
        color: #1e40af;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem;
        color: #64748b;
        text-align: center;
    }

    .empty-state i {
        font-size: 2rem;
    }

    .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        align-items: flex-start;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .filter-group label {
        color: #475569;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    .select-wrapper {
        display: none;
    }

    .source-dropdown {
        display: none;
    }

    .dropdown-menu {
        display: none;
    }

    .dropdown-item {
        display: none;
    }

    @media (max-width: 767.98px) {
        .content-card {
            padding: 1.5rem;
        }

        .form-grid {
            grid-template-columns: 1fr;
        }

        .candidate-header {
            flex-direction: column;
            gap: 0.5rem;
        }

        .candidate-meta {
            width: 100%;
        }

        .position-tag {
            width: 100%;
            justify-content: flex-start;
        }

        .filters {
            flex-direction: column;
            width: 100%;
        }

        .select-wrapper,
        .source-dropdown {
            width: 100%;
        }

        .source-button {
            width: 100%;
            justify-content: space-between;
        }
    }

    .top-filters {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 2rem;
    }

    .filter-label {
        color: #64748b;
        font-size: 0.875rem;
    }

    .filter-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #1e293b;
        cursor: pointer;
    }

    .filter-button:hover {
        background: #f8fafc;
    }

    .add-form-container {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .form-row > * { flex: 1; }

    .form-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    .form-actions button {
        min-width: 100px;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
    }

    .btn-primary {
        background: #3b82f6;
        color: white;
        border: none;
    }

    .btn-primary:hover { background: #2563eb; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

    .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover { background: #e2e8f0; }

    .candidates-count {
        color: #64748b;
        font-size: 0.875rem;
        text-align: right;
        margin-top: 1rem;
    }

    @media (max-width: 767.98px) {
        .form-row {
            flex-direction: column;
        }

        .form-actions {
            flex-direction: row;
            justify-content: flex-end;
            margin-top: 1rem;
        }
    }

    .candidate-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .btn-delete {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn-delete:hover {
        background: #fee2e2;
    }

    .timeline-section {
        margin-top: 1.5rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1.5rem;
    }

    .filters-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        margin-bottom: 1rem;
        transition: all 0.2s ease;
    }

    .filters-toggle:hover {
        background: #f1f5f9;
    }

    .filters-toggle i {
        color: #64748b;
        font-size: 1rem;
    }

    .filters-toggle span {
        color: #1e293b;
        font-weight: 500;
        flex: 1;
    }

    .filters-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
    }

    .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .filter-group label {
        font-size: 0.875rem;
        color: #64748b;
        font-weight: 500;
    }

    .filter-group select {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        background-color: white;
        width: 100%;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1rem;
        padding-right: 2.5rem;
    }

    .filter-group select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    @media (max-width: 768px) {
        .filters {
            grid-template-columns: 1fr;
        }
    }

    /* Remove form-specific styles since we're using Bootstrap now */
    .form-group,
    .form-group input,
    .form-group select,
    .form-actions,
    .pay-range-inputs {
        display: none;
    }

    /* Keep other styles that aren't form-related */
    .add-candidate-section {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .add-candidate-section h3 {
        color: #1e293b;
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }
</style> 