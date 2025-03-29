<script>
    import { base } from '$app/paths';
    let title = $state('AWS SvelteKit Test');
    let pageTitle = $derived(title);
    let positionsTestResult = $state(null);
    let candidatesTestResult = $state(null);
    let testDataResult = $state(null);
    let isGeneratingData = $state(false);
    let isCleaningData = $state(false);
    let positions = $state([]);
    let candidates = $state([]);
    let isLoadingData = $state(false);
    
    $effect(() => {
        document.title = pageTitle;
    });

    let { data } = $props();
    let dbStatusClass = $derived(data?.dbStatus?.status === 'success' ? 'success' : 'error');

    async function testPositionsAPI() {
        try {
            // Test POST
            const newPosition = {
                title: 'Test Position',
                description: 'This is a test position',
                requirements: 'Test requirements',
                status: 'open'
            };
            
            const createResponse = await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPosition)
            });
            
            if (!createResponse.ok) throw new Error('Failed to create position');
            const createdPosition = await createResponse.json();
            
            // Test GET (single)
            const getResponse = await fetch(`/api/positions?id=${createdPosition.id}`);
            if (!getResponse.ok) throw new Error('Failed to get position');
            const fetchedPosition = await getResponse.json();
            
            // Test PUT
            const updatedPosition = {
                ...fetchedPosition,
                title: 'Updated Test Position'
            };
            
            const updateResponse = await fetch('/api/positions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPosition)
            });
            
            if (!updateResponse.ok) throw new Error('Failed to update position');
            
            // Test DELETE
            const deleteResponse = await fetch(`/api/positions?id=${createdPosition.id}`, {
                method: 'DELETE'
            });
            
            if (!deleteResponse.ok) throw new Error('Failed to delete position');
            
            positionsTestResult = {
                success: true,
                message: 'All position API tests passed successfully!'
            };
        } catch (error) {
            positionsTestResult = {
                success: false,
                message: `Position API test failed: ${error.message}`
            };
        }
    }

    async function testCandidatesAPI() {
        try {
            // Test POST
            const newCandidate = {
                name: 'Test Candidate',
                email: 'test@example.com',
                phone: '123-456-7890',
                resume: 'Test resume content',
                status: 'new',
                positionId: 'test-position-id'
            };
            
            const createResponse = await fetch('/api/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCandidate)
            });
            
            if (!createResponse.ok) throw new Error('Failed to create candidate');
            const createdCandidate = await createResponse.json();
            
            // Test GET (single)
            const getResponse = await fetch(`/api/candidates?id=${createdCandidate.id}`);
            if (!getResponse.ok) throw new Error('Failed to get candidate');
            const fetchedCandidate = await getResponse.json();
            
            // Test PUT
            const updatedCandidate = {
                ...fetchedCandidate,
                name: 'Updated Test Candidate'
            };
            
            const updateResponse = await fetch('/api/candidates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCandidate)
            });
            
            if (!updateResponse.ok) throw new Error('Failed to update candidate');
            
            // Test DELETE
            const deleteResponse = await fetch(`/api/candidates?id=${createdCandidate.id}`, {
                method: 'DELETE'
            });
            
            if (!deleteResponse.ok) throw new Error('Failed to delete candidate');
            
            candidatesTestResult = {
                success: true,
                message: 'All candidate API tests passed successfully!'
            };
        } catch (error) {
            candidatesTestResult = {
                success: false,
                message: `Candidate API test failed: ${error.message}`
            };
        }
    }

    async function generateTestData() {
        isGeneratingData = true;
        testDataResult = null;
        
        try {
            // Generate positions
            const positions = [
                {
                    title: 'Senior Software Engineer',
                    description: 'Looking for an experienced software engineer to join our team',
                    requirements: '5+ years experience, React, Node.js, AWS',
                    status: 'open'
                },
                {
                    title: 'Product Manager',
                    description: 'Seeking a product manager to drive our product development',
                    requirements: '3+ years PM experience, Agile, User Research',
                    status: 'open'
                },
                {
                    title: 'UX Designer',
                    description: 'Join our design team to create beautiful user experiences',
                    requirements: '3+ years UX experience, Figma, User Testing',
                    status: 'open'
                }
            ];

            // Create positions
            for (const position of positions) {
                const response = await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(position)
                });
                
                if (!response.ok) throw new Error('Failed to create position');
                const createdPosition = await response.json();
                
                // Generate candidates for each position
                const candidates = [
                    {
                        name: 'John Smith',
                        email: 'john.smith@example.com',
                        phone: '555-0101',
                        resume: 'Experienced software engineer with 8 years of experience...',
                        status: 'new',
                        positionId: createdPosition.id
                    },
                    {
                        name: 'Sarah Johnson',
                        email: 'sarah.j@example.com',
                        phone: '555-0102',
                        resume: 'Product manager with 5 years of experience...',
                        status: 'new',
                        positionId: createdPosition.id
                    },
                    {
                        name: 'Michael Chen',
                        email: 'm.chen@example.com',
                        phone: '555-0103',
                        resume: 'UX designer with 4 years of experience...',
                        status: 'new',
                        positionId: createdPosition.id
                    }
                ];

                // Create candidates
                for (const candidate of candidates) {
                    const response = await fetch('/api/candidates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(candidate)
                    });
                    
                    if (!response.ok) throw new Error('Failed to create candidate');
                }
            }

            testDataResult = {
                success: true,
                message: 'Successfully generated test data: 3 positions and 9 candidates'
            };

            // Refresh the data view
            await loadTestData();
        } catch (error) {
            testDataResult = {
                success: false,
                message: `Failed to generate test data: ${error.message}`
            };
        } finally {
            isGeneratingData = false;
        }
    }

    async function loadTestData() {
        try {
            // Load all positions
            const positionsResponse = await fetch('/api/positions');
            if (!positionsResponse.ok) throw new Error('Failed to load positions');
            positions = await positionsResponse.json();
            console.log('Loaded positions:', positions);

            // Load all candidates
            const candidatesResponse = await fetch('/api/candidates');
            if (!candidatesResponse.ok) throw new Error('Failed to load candidates');
            candidates = await candidatesResponse.json();
            console.log('Loaded candidates:', candidates);
        } catch (error) {
            console.error('Error loading test data:', error);
        }
    }

    // Load data when component mounts
    $effect(() => {
        console.log('Component mounted, loading data...');
        loadTestData();
    });

    // Helper function to get candidates for a position
    function getCandidatesForPosition(positionId) {
        const filteredCandidates = candidates.filter(c => c.positionId === positionId);
        console.log(`Candidates for position ${positionId}:`, filteredCandidates);
        return filteredCandidates;
    }

    // Effect to monitor positions changes
    $effect(() => {
        $inspect(positions, 'Positions updated');
    });

    // Effect to monitor candidates changes
    $effect(() => {
        $inspect(candidates, 'Candidates updated');
    });

    async function cleanupTestData() {
        isCleaningData = true;
        testDataResult = null;
        
        try {
            // First get all positions
            const positionsResponse = await fetch('/api/positions');
            if (!positionsResponse.ok) throw new Error('Failed to load positions');
            const positions = await positionsResponse.json();
            
            // Delete all positions
            for (const position of positions) {
                const response = await fetch(`/api/positions?id=${position.id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error(`Failed to delete position ${position.id}`);
            }

            // Then get all candidates
            const candidatesResponse = await fetch('/api/candidates');
            if (!candidatesResponse.ok) throw new Error('Failed to load candidates');
            const candidates = await candidatesResponse.json();
            
            // Delete all candidates
            for (const candidate of candidates) {
                const response = await fetch(`/api/candidates?id=${candidate.id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error(`Failed to delete candidate ${candidate.id}`);
            }

            testDataResult = {
                success: true,
                message: `Successfully cleaned up ${positions.length} positions and ${candidates.length} candidates`
            };

            // Refresh the data view
            await loadTestData();
        } catch (error) {
            testDataResult = {
                success: false,
                message: `Failed to clean up test data: ${error.message}`
            };
        } finally {
            isCleaningData = false;
        }
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
                        disabled={isGeneratingData}
                    >
                        <i class="bi {isGeneratingData ? 'bi-hourglass-split' : 'bi-plus-circle-fill'}"></i>
                        {isGeneratingData ? 'Generating...' : 'Generate Test Data'}
                    </button>
                    <button 
                        class="btn btn-danger" 
                        onclick={cleanupTestData}
                        disabled={isCleaningData}
                    >
                        <i class="bi {isCleaningData ? 'bi-hourglass-split' : 'bi-trash-fill'}"></i>
                        {isCleaningData ? 'Cleaning...' : 'Clean Up Test Data'}
                    </button>
                </div>
                {#if testDataResult}
                    <div class="test-result {testDataResult.success ? 'success' : 'error'}">
                        <i class="bi {testDataResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        <span>{testDataResult.message}</span>
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
                {#if positions.length === 0}
                    <div class="empty-state">
                        <i class="bi bi-database-x"></i>
                        <span>No test data available. Generate some data first!</span>
                    </div>
                {:else}
                    <div class="data-view">
                        {#each positions as position}
                            <div class="position-card">
                                <div class="position-header">
                                    <h3>{position.title}</h3>
                                    <span class="status-badge {position.status}">{position.status}</span>
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
                {#if positionsTestResult}
                    <div class="test-result {positionsTestResult.success ? 'success' : 'error'}">
                        <i class="bi {positionsTestResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        <span>{positionsTestResult.message}</span>
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
                {#if candidatesTestResult}
                    <div class="test-result {candidatesTestResult.success ? 'success' : 'error'}">
                        <i class="bi {candidatesTestResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        <span>{candidatesTestResult.message}</span>
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
</style> 