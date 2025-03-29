<script>
    import { base } from '$app/paths';
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

    // Form data
    let newCandidate = $state({
        name: '',
        email: '',
        status: 'new',
        positionId: '',
        expectedPayRange: {
            min: '',
            max: '',
            currency: 'USD'
        },
        source: '',
        sourceName: ''
    });

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
            status: 'new',
            positionId: '',
            expectedPayRange: { min: '', max: '', currency: 'USD' },
            source: '',
            sourceName: ''
        };
    }
</script>

<div class="page-container">
    <div class="content-card">
        <!-- Top Filters -->
        <div class="top-filters">
            <span class="filter-label">Filter by:</span>
            <button class="filter-button">
                <i class="bi bi-building"></i>
                Department
                <i class="bi bi-chevron-down"></i>
            </button>
            <button class="filter-button">
                <i class="bi bi-kanban"></i>
                Stage
                <i class="bi bi-chevron-down"></i>
            </button>
            <button class="filter-button">
                <i class="bi bi-person-badge"></i>
                Source
                <i class="bi bi-chevron-down"></i>
            </button>
        </div>

        <!-- Inline Add Form -->
        <div class="add-form-container">
            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
                <div class="form-row">
                    <select bind:value={newCandidate.positionId} required>
                        <option value="">Position</option>
                        {#each positions as position}
                            <option value={position.id}>{position.title}</option>
                        {/each}
                    </select>

                    <input 
                        type="text" 
                        bind:value={newCandidate.name}
                        placeholder="Name"
                        required
                    />

                    <input 
                        type="email" 
                        bind:value={newCandidate.email}
                        placeholder="Email"
                        required
                    />
                </div>

                <div class="form-row">
                    <select bind:value={newCandidate.source} required>
                        <option value="">Source</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="referral">Referral</option>
                    </select>

                    <input 
                        type="text" 
                        bind:value={newCandidate.sourceName}
                        placeholder="Source Contact"
                        required
                    />

                    <div class="pay-range-group">
                        <input 
                            type="number" 
                            bind:value={newCandidate.expectedPayRange.min}
                            placeholder="Min ($)"
                            required
                        />
                        <span>to</span>
                        <input 
                            type="number" 
                            bind:value={newCandidate.expectedPayRange.max}
                            placeholder="Max ($)"
                            required
                        />
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick={resetForm}>
                            Cancel
                        </button>
                        <button type="submit" class="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </div>

                {#if formError}
                    <div class="alert-error">
                        <i class="bi bi-exclamation-circle-fill"></i>
                        {formError}
                    </div>
                {/if}

                {#if formSuccess}
                    <div class="alert-success">
                        <i class="bi bi-check-circle-fill"></i>
                        {formSuccess}
                    </div>
                {/if}
            </form>

            <div class="candidates-count">
                Showing {getFilteredCandidates().length} of {candidates.length} candidates
            </div>
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
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    .page-container {
        max-width: 1800px;
        margin: 0 auto;
        padding: 0.5rem;
    }

    .content-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
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

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
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

    .form-actions {
        margin-top: 1.5rem;
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
        padding: 1.5rem;
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
        position: relative;
        min-width: 300px;
    }

    .select-wrapper select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background-color: white;
        font-size: 0.875rem;
        appearance: none;
        padding-right: 2rem;
    }

    .select-wrapper::after {
        content: '';
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid #64748b;
        pointer-events: none;
    }

    .source-dropdown {
        position: relative;
        display: inline-block;
    }

    .source-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #1e293b;
        cursor: pointer;
    }

    .source-button:hover {
        background: #f8fafc;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 0.25rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        min-width: 150px;
        z-index: 10;
        display: none;
    }

    .source-dropdown:hover .dropdown-menu {
        display: block;
    }

    .dropdown-item {
        padding: 0.5rem 1rem;
        cursor: pointer;
        color: #1e293b;
    }

    .dropdown-item:hover {
        background: #f8fafc;
    }

    .dropdown-item.active {
        background: #3b82f6;
        color: white;
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

    /* Remove unused selectors */
    .header,
    .header-left,
    .form-card,
    .form-grid,
    .form-group,
    .pay-range-inputs,
    .candidate-resume,
    .filter-group,
    .select-wrapper,
    .source-dropdown,
    .dropdown-menu,
    .dropdown-item {
        display: none;
    }
</style> 