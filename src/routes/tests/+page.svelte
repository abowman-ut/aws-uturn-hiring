<script>
    import { base } from '$app/paths';
    import { untrack } from 'svelte';

    // Page state
    let title = $state('AWS SvelteKit Test');
    let { data } = $props();
    
    // Test results state
    let testResults = $state({
        positions: null,
        candidates: null,
        testData: null
    });
    
    // Loading states
    let isLoading = $state({
        data: false,
        generating: false,
        cleaning: false
    });

    // Data state
    let testData = $state({
        positions: [],
        candidates: []
    });

    // Set page title
    $effect(() => {
        document.title = title;
    });

    // Computed class for DB status
    let dbStatusClass = $derived(data?.dbStatus?.status === 'success' ? 'success' : 'error');

    // Load test data
    async function loadTestData() {
        if (isLoading.data) return;
        
        try {
            isLoading.data = true;
            
            // Load data in parallel
            const [positionsRes, candidatesRes] = await Promise.all([
                fetch('/api/positions'),
                fetch('/api/candidates')
            ]);

            if (!positionsRes.ok) throw new Error('Failed to load positions');
            if (!candidatesRes.ok) throw new Error('Failed to load candidates');

            // Update state atomically
            const positions = await positionsRes.json();
            const candidates = await candidatesRes.json();
            
            testData = {
                positions: positions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
                candidates
            };
        } catch (error) {
            console.error('Error loading test data:', error);
        } finally {
            isLoading.data = false;
        }
    }

    // Load data on mount
    $effect(() => {
        loadTestData();
    });

    // Test APIs
    async function testPositionsAPI() {
        try {
            const position = {
                title: 'Test Position',
                department: 'Engineering',
                hiringManager: 'Test Manager',
                timeline: 'Q2',
                state: 'open',
                payRange: {
                    min: 100000,
                    max: 150000
                },
                description: 'This is a test position',
                requirements: 'Test requirements'
            };
            
            // Test CRUD operations
            const created = await testCRUD('/api/positions', position);
            
            testResults = {
                ...testResults,
                positions: {
                    success: true,
                    message: 'All position API tests passed successfully!'
                }
            };
        } catch (error) {
            testResults = {
                ...testResults,
                positions: {
                    success: false,
                    message: `Position API test failed: ${error.message}`
                }
            };
        }
    }

    async function testCandidatesAPI() {
        try {
            // First create a test position to use for the candidate
            const position = {
                title: 'Test Position for Candidate',
                department: 'Engineering',
                hiringManager: 'Test Manager',
                timeline: 'Q2',
                state: 'open',
                payRange: {
                    min: 100000,
                    max: 150000
                }
            };
            
            const posRes = await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(position)
            });
            
            if (!posRes.ok) {
                throw new Error('Failed to create test position');
            }
            
            const testPosition = await posRes.json();

            const candidate = {
                name: 'Test Candidate',
                email: 'test@example.com',
                positionId: testPosition.id,
                expectedPayRange: {
                    min: 120000,
                    max: 140000,
                    currency: 'USD'
                },
                source: 'recruiter',
                sourceName: 'Test Recruiter',
                status: 'cv_review',
                stages: [
                    {
                        id: 'cv_review',
                        name: 'CV Review',
                        startedAt: new Date().toISOString(),
                        status: 'in_progress'
                    }
                ]
            };
            
            // Test CRUD operations
            await testCRUD('/api/candidates', candidate);
            
            // Clean up test position
            await fetch(`/api/positions?id=${testPosition.id}`, {
                method: 'DELETE'
            });
            
            testResults = {
                ...testResults,
                candidates: {
                    success: true,
                    message: 'All candidate API tests passed successfully!'
                }
            };
        } catch (error) {
            testResults = {
                ...testResults,
                candidates: {
                    success: false,
                    message: `Candidate API test failed: ${error.message}`
                }
            };
        }
    }

    // Helper function for CRUD testing
    async function testCRUD(endpoint, data) {
        // Create
        const createRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!createRes.ok) throw new Error('Create failed');
        const created = await createRes.json();
        
        // Read
        const readRes = await fetch(`${endpoint}?id=${created.id}`);
        if (!readRes.ok) throw new Error('Read failed');
        
        // Update
        const updateRes = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...created, title: 'Updated Test' })
        });
        if (!updateRes.ok) throw new Error('Update failed');
        
        // Delete
        const deleteRes = await fetch(`${endpoint}?id=${created.id}`, {
            method: 'DELETE'
        });
        if (!deleteRes.ok) throw new Error('Delete failed');
        
        return created;
    }

    // Generate test data
    async function generateTestData() {
        if (isLoading.generating) return;
        
        try {
            isLoading.generating = true;
            testResults.testData = null;
            
            const positions = [
                {
                    title: 'Senior Software Engineer',
                    department: 'Engineering',
                    hiringManager: 'Sarah Chen',
                    timeline: 'Q2',
                    state: 'open',
                    payRange: {
                        min: 120000,
                        max: 180000
                    },
                    description: 'Looking for an experienced software engineer',
                    requirements: '5+ years experience, React, Node.js, AWS'
                },
                {
                    title: 'Product Manager',
                    department: 'Management',
                    hiringManager: 'Michael Rodriguez',
                    timeline: 'Q3',
                    state: 'open',
                    payRange: {
                        min: 130000,
                        max: 190000
                    },
                    description: 'Seeking a product manager',
                    requirements: '3+ years PM experience'
                }
            ];

            // Create positions and their candidates
            for (const position of positions) {
                const posRes = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                if (!posRes.ok) {
                    const error = await posRes.json();
                    throw new Error(`Failed to create position: ${error.error || 'Unknown error'}`);
                }
                
                const pos = await posRes.json();
                
                // Create candidates for this position
                const candidates = [
                    {
                        name: 'John Smith',
                        email: 'john@example.com',
                        positionId: pos.id,
                        expectedPayRange: {
                            min: 140000,
                            max: 160000,
                            currency: 'USD'
                        },
                        source: 'recruiter',
                        sourceName: 'LinkedIn Recruiter',
                        status: 'cv_review',
                        stages: [
                            {
                                id: 'cv_review',
                                name: 'CV Review',
                                startedAt: new Date().toISOString(),
                                status: 'in_progress'
                            }
                        ]
                    },
                    {
                        name: 'Sarah Johnson',
                        email: 'sarah@example.com',
                        positionId: pos.id,
                        expectedPayRange: {
                            min: 150000,
                            max: 170000,
                            currency: 'USD'
                        },
                        source: 'referral',
                        sourceName: 'Internal Employee',
                        status: 'culture_fit',
                        stages: [
                            {
                                id: 'cv_review',
                                name: 'CV Review',
                                startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                                completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                                status: 'completed'
                            },
                            {
                                id: 'culture_fit',
                                name: 'Culture Fit',
                                startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                                status: 'in_progress'
                            }
                        ]
                    }
                ];

                for (const candidate of candidates) {
                    const candRes = await fetch('/api/candidates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(candidate)
                    });
                    if (!candRes.ok) {
                        const error = await candRes.json();
                        throw new Error(`Failed to create candidate: ${error.error || 'Unknown error'}`);
                    }
                }
            }

            testResults = {
                ...testResults,
                testData: {
                    success: true,
                    message: 'Successfully generated test data'
                }
            };

            await loadTestData();
        } catch (error) {
            testResults = {
                ...testResults,
                testData: {
                    success: false,
                    message: `Failed to generate test data: ${error.message}`
                }
            };
        } finally {
            isLoading.generating = false;
        }
    }

    // Clean up test data
    async function cleanupTestData() {
        if (isLoading.cleaning) return;
        
        try {
            isLoading.cleaning = true;
            testResults.testData = null;

            // Delete all positions and candidates
            await Promise.all([
                deleteAllItems('/api/positions'),
                deleteAllItems('/api/candidates')
            ]);

            testResults = {
                ...testResults,
                testData: {
                    success: true,
                    message: 'Successfully cleaned up test data'
                }
            };

            await loadTestData();
        } catch (error) {
            testResults = {
                ...testResults,
                testData: {
                    success: false,
                    message: `Failed to clean up test data: ${error.message}`
                }
            };
        } finally {
            isLoading.cleaning = false;
        }
    }

    // Helper to delete all items of a type
    async function deleteAllItems(endpoint) {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`Failed to fetch items from ${endpoint}`);
        
        const items = await res.json();
        
        await Promise.all(
            items.map(item => 
                fetch(`${endpoint}?id=${item.id}`, { method: 'DELETE' })
            )
        );
    }

    // Helper to get candidates for a position
    function getCandidatesForPosition(positionId) {
        return untrack(() => 
            testData.candidates.filter(c => c.positionId === positionId)
        );
    }
</script>

<div class="page-container">
    <div class="content-card">
        <div class="header">
            <i class="bi bi-gear-fill text-primary"></i>
            <h1>{title}</h1>
        </div>
        <p class="text-muted mb-4">Welcome to the AWS SvelteKit testing environment</p>
        
        <div class="test-section">
            <div class="section-header">
                <i class="bi bi-database-fill text-primary"></i>
                <h2>DynamoDB Connection Status</h2>
            </div>
            {#if data?.dbStatus}
                <div class="status-card {dbStatusClass}">
                    <div class="status-icon">
                        <i class="bi {data.dbStatus.status === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}"></i>
                    </div>
                    <div class="status-content">
                        <h3>
                            Status: 
                            <span class="status-text">
                                {data.dbStatus.status}
                            </span>
                        </h3>
                        <p>{data.dbStatus.message}</p>
                    </div>
                </div>
            {:else}
                <div class="status-card loading">
                    <div class="status-icon">
                        <i class="bi bi-hourglass-split"></i>
                    </div>
                    <div class="status-content">
                        <p>Loading connection status...</p>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Test Data Section -->
        <div class="test-section">
            <div class="section-header">
                <i class="bi bi-database-add text-primary"></i>
                <h2>Test Data</h2>
            </div>
            <div class="api-test-group">
                <p class="text-muted mb-3">Generate or clean up sample positions and candidates for testing</p>
                <div class="test-controls">
                    <button 
                        class="btn btn-primary me-2" 
                        onclick={generateTestData}
                        disabled={isLoading.generating}
                    >
                        <i class="bi {isLoading.generating ? 'bi-hourglass-split' : 'bi-plus-circle-fill'}"></i>
                        {isLoading.generating ? 'Generating...' : 'Generate Test Data'}
                    </button>
                    <button 
                        class="btn btn-danger" 
                        onclick={cleanupTestData}
                        disabled={isLoading.cleaning}
                    >
                        <i class="bi {isLoading.cleaning ? 'bi-hourglass-split' : 'bi-trash-fill'}"></i>
                        {isLoading.cleaning ? 'Cleaning...' : 'Clean Up Test Data'}
                    </button>
                </div>
                {#if testResults.testData}
                    <div class="test-result {testResults.testData.success ? 'success' : 'error'}">
                        <i class="bi {testResults.testData.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        <span>{testResults.testData.message}</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Test Data View Section -->
        <div class="test-section">
            <div class="section-header">
                <i class="bi bi-table text-primary"></i>
                <h2>Test Data View</h2>
            </div>
            <div class="api-test-group">
                {#if testData.positions.length === 0}
                    <div class="empty-state">
                        <i class="bi bi-database-x"></i>
                        <span>No test data available. Generate some data first!</span>
                    </div>
                {:else}
                    <div class="data-view">
                        {#each testData.positions as position}
                            <div class="position-card">
                                <div class="position-header">
                                    <div class="position-title">
                                        <h3>{position.title}</h3>
                                        <span class="department-badge">{position.department}</span>
                                    </div>
                                    <div class="position-meta">
                                        <span class="timeline-tag">
                                            <i class="bi bi-calendar"></i>
                                            {position.timeline}
                                        </span>
                                        <span class="status-badge {position.status}">{position.status}</span>
                                    </div>
                                </div>
                                <div class="position-details">
                                    <div class="detail-group">
                                        <i class="bi bi-person"></i>
                                        <span>{position.hiringManager}</span>
                                    </div>
                                </div>
                                <p class="description">{position.description}</p>
                                <p class="requirements"><strong>Requirements:</strong> {position.requirements}</p>
                                
                                <div class="candidates-section">
                                    <h4>Candidates ({getCandidatesForPosition(position.id).length})</h4>
                                    {#each getCandidatesForPosition(position.id) as candidate}
                                        <div class="candidate-card">
                                            <div class="candidate-header">
                                                <h5>{candidate.name}</h5>
                                                <span class="status-badge {candidate.status}">{candidate.status}</span>
                                            </div>
                                            <div class="candidate-details">
                                                <p><i class="bi bi-envelope"></i> {candidate.email}</p>
                                                <p><i class="bi bi-telephone"></i> {candidate.phone}</p>
                                                <p><i class="bi bi-cash"></i> {candidate.expectedPayRange?.min ? `$${candidate.expectedPayRange.min.toLocaleString()} - $${candidate.expectedPayRange.max.toLocaleString()}` : 'Not specified'}</p>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- API Tests Section -->
        <div class="test-section">
            <div class="section-header">
                <i class="bi bi-code-square text-primary"></i>
                <h2>API Tests</h2>
            </div>

            <!-- Positions API Tests -->
            <div class="api-test-group">
                <h3>Positions API</h3>
                <div class="test-controls">
                    <button class="btn btn-primary" onclick={testPositionsAPI}>
                        <i class="bi bi-play-fill"></i> Run Tests
                    </button>
                </div>
                {#if testResults.positions}
                    <div class="test-result {testResults.positions.success ? 'success' : 'error'}">
                        <i class="bi {testResults.positions.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        <span>{testResults.positions.message}</span>
                    </div>
                {/if}
            </div>

            <!-- Candidates API Tests -->
            <div class="api-test-group">
                <h3>Candidates API</h3>
                <div class="test-controls">
                    <button class="btn btn-primary" onclick={testCandidatesAPI}>
                        <i class="bi bi-play-fill"></i> Run Tests
                    </button>
                </div>
                {#if testResults.candidates}
                    <div class="test-result {testResults.candidates.success ? 'success' : 'error'}">
                        <i class="bi {testResults.candidates.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        <span>{testResults.candidates.message}</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .page-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .content-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
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

    .section-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .section-header i {
        font-size: 1.25rem;
    }

    h2 {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0;
    }

    .test-section {
        border-top: 1px solid #e2e8f0;
        padding-top: 1.5rem;
        margin-top: 1.5rem;
    }

    .status-card {
        display: flex;
        align-items: flex-start;
        padding: 1.5rem;
        border-radius: 12px;
        margin-top: 1rem;
        transition: all 0.2s ease;
    }

    .status-card.success {
        background-color: #ecfdf5;
        border: 1px solid #6ee7b7;
    }

    .status-card.error {
        background-color: #fef2f2;
        border: 1px solid #fca5a5;
    }

    .status-card.loading {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
    }

    .status-icon {
        font-size: 1.5rem;
        margin-right: 1rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 8px;
    }

    .success .status-icon {
        color: #059669;
        background-color: #d1fae5;
    }

    .error .status-icon {
        color: #dc2626;
        background-color: #fee2e2;
    }

    .loading .status-icon {
        color: #64748b;
        background-color: #f1f5f9;
    }

    .status-content h3 {
        font-size: 1rem;
        font-weight: 500;
        margin: 0 0 0.5rem;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .status-text {
        text-transform: capitalize;
    }

    .success .status-text {
        color: #059669;
    }

    .error .status-text {
        color: #dc2626;
    }

    .status-content p {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
        line-height: 1.5;
    }

    :global(.text-primary) {
        color: #4361ee !important;
    }

    @media (max-width: 767.98px) {
        .content-card {
            padding: 1.5rem;
        }

        .status-card {
            padding: 1rem;
        }

        .status-icon {
            width: 2rem;
            height: 2rem;
            font-size: 1.25rem;
        }
    }

    .api-test-group {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid #e2e8f0;
    }

    .api-test-group h3 {
        color: #1e293b;
        font-size: 1.25rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .test-controls {
        margin-bottom: 1rem;
    }

    .test-result {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.9375rem;
    }

    .test-result.success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
    }

    .test-result.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
    }

    .test-result i {
        font-size: 1.25rem;
    }

    :global(.btn) {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    :global(.btn-primary) {
        background: #4361ee;
        color: white;
        border: none;
    }

    :global(.btn-primary:hover) {
        background: #3651d4;
    }

    .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .text-muted {
        color: #64748b;
        font-size: 0.9375rem;
    }

    .mb-3 {
        margin-bottom: 1rem;
    }

    .empty-state {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        color: #64748b;
        font-size: 0.9375rem;
    }

    .data-view {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .position-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .position-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .position-header h3 {
        margin: 0;
        color: #1e293b;
        font-size: 1.25rem;
    }

    .description {
        color: #64748b;
        margin-bottom: 0.75rem;
    }

    .requirements {
        color: #475569;
        margin-bottom: 1rem;
    }

    .candidates-section {
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }

    .candidates-section h4 {
        color: #1e293b;
        font-size: 1rem;
        margin-bottom: 1rem;
    }

    .candidate-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 0.75rem;
    }

    .candidate-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .candidate-header h5 {
        margin: 0;
        color: #1e293b;
        font-size: 1rem;
    }

    .candidate-details {
        display: flex;
        gap: 1rem;
        color: #64748b;
        font-size: 0.875rem;
    }

    .candidate-details p {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
    }

    .status-badge.open {
        background: #dcfce7;
        color: #166534;
    }

    .status-badge.new {
        background: #dbeafe;
        color: #1e40af;
    }

    @media (max-width: 767.98px) {
        .position-card {
            padding: 1rem;
        }

        .candidate-details {
            flex-direction: column;
            gap: 0.5rem;
        }
    }

    .me-2 {
        margin-right: 0.5rem;
    }

    .btn-danger {
        background-color: #dc2626;
        border-color: #dc2626;
        color: white;
    }

    .btn-danger:hover {
        background-color: #b91c1c;
        border-color: #b91c1c;
    }

    .btn-danger:disabled {
        background-color: #ef4444;
        border-color: #ef4444;
        opacity: 0.7;
    }

    .position-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .position-meta {
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

    .department-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
        background: #dbeafe;
        color: #1e40af;
    }

    .position-details {
        display: flex;
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
</style> 