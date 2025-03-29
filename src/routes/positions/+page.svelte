<script>
    import { base } from '$app/paths';
    let title = $state('Positions');
    let pageTitle = $derived(title);
    let positions = $state([]);
    let showAddForm = $state(false);
    let isSubmitting = $state(false);
    let formError = $state(null);
    let formSuccess = $state(null);
    let selectedDepartment = $state('');
    let selectedTimeline = $state('');

    // Form data
    let newPosition = $state({
        title: '',
        department: '',
        hiringManager: '',
        timeline: ''
    });

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

<div class="page-container">
    <div class="content-card">
        <!-- Top Filters -->
        <div class="top-filters">
            <span class="filter-label">Filter by:</span>
            <select bind:value={selectedDepartment} class="filter-select">
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Management">Management</option>
                <option value="Sales">Sales</option>
            </select>
            <select bind:value={selectedTimeline} class="filter-select">
                <option value="">All Timelines</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
            </select>
        </div>

        <!-- Add Position Form -->
        <div class="add-form-container">
            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
                <div class="form-row">
                    <input 
                        type="text" 
                        bind:value={newPosition.title}
                        placeholder="Position Title"
                        required
                    />

                    <select bind:value={newPosition.department} required>
                        <option value="">Department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Management">Management</option>
                        <option value="Sales">Sales</option>
                    </select>

                    <input 
                        type="text" 
                        bind:value={newPosition.hiringManager}
                        placeholder="Hiring Manager"
                        required
                    />

                    <select bind:value={newPosition.timeline} required>
                        <option value="">Timeline</option>
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                    </select>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick={resetForm}>
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Position'}
                    </button>
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

            <div class="positions-count">
                Showing {getFilteredPositions().length} of {positions.length} positions
            </div>
        </div>

        <!-- Positions List -->
        <div class="positions-list">
            {#if getFilteredPositions().length === 0}
                <div class="empty-state">
                    <i class="bi bi-briefcase"></i>
                    <span>No positions found</span>
                </div>
            {:else}
                {#each getFilteredPositions() as position}
                    <div class="position-card">
                        <div class="position-header">
                            <div class="position-title">
                                <h3>{position.title}</h3>
                                <span class="department-badge">{position.department}</span>
                            </div>
                            <div class="position-actions">
                                <span class="timeline-tag">
                                    <i class="bi bi-calendar"></i>
                                    {position.timeline}
                                </span>
                                <button 
                                    class="btn-delete" 
                                    onclick={() => deletePosition(position.id)}
                                    title="Delete position"
                                    aria-label="Delete position"
                                >
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="position-details">
                            <div class="detail-group">
                                <i class="bi bi-person"></i>
                                <span>{position.hiringManager}</span>
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

    .filter-select {
        padding: 0.5rem 0.75rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #1e293b;
        cursor: pointer;
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

    input, select {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
    }

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

    .positions-count {
        color: #64748b;
        font-size: 0.875rem;
        text-align: right;
        margin-top: 1rem;
    }

    .positions-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .position-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .position-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    .position-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .position-title h3 {
        margin: 0;
        color: #1e293b;
        font-size: 1.25rem;
    }

    .position-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .timeline-tag {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #64748b;
        font-size: 0.875rem;
    }

    .position-details {
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

    .department-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
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

    @media (max-width: 767.98px) {
        .content-card {
            padding: 1.5rem;
        }

        .form-row {
            flex-direction: column;
        }

        .form-actions {
            flex-direction: row;
            justify-content: flex-end;
            margin-top: 1rem;
        }

        .position-header {
            flex-direction: column;
            gap: 0.5rem;
        }

        .position-actions {
            width: 100%;
            justify-content: flex-start;
        }

        .timeline-tag {
            width: 100%;
            justify-content: flex-start;
        }
    }
</style> 