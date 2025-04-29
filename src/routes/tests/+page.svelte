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
        cleaning: false,
        testing: false
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
            
            console.log('Loaded positions:', positions);
            console.log('Loaded candidates:', candidates.map(c => ({
                name: c.name,
                status: c.status,
                stages: c.stages
            })));
            
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

    // Initialize tests
    let hasInitialized = $state(false);
    
    // Load data and run tests on mount
    $effect(() => {
        if (!hasInitialized && data?.dbStatus?.status === 'success') {
            hasInitialized = true;
            (async () => {
                await loadTestData();
                await testPositionsAPI();
                await testCandidatesAPI();
            })();
        }
    });

    // Helper function for CRUD testing
    async function testCRUD(endpoint, data) {
        const results = {
            create: { success: false, message: '' },
            read: { success: false, message: '' },
            update: { success: false, message: '' },
            delete: { success: false, message: '' }
        };
        
        let createdItem = null;
        
        try {
            // Create
            const createRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!createRes.ok) {
                const error = await createRes.json();
                throw new Error(`Create failed: ${error.error || 'Unknown error'}`);
            }
            createdItem = await createRes.json();
            results.create = { success: true, message: 'Successfully created item' };
            
            // Read
            const readRes = await fetch(`${endpoint}?id=${createdItem.id}`);
            if (!readRes.ok) {
                const error = await readRes.json();
                throw new Error(`Read failed: ${error.error || 'Unknown error'}`);
            }
            const readItem = await readRes.json();
            results.read = { success: true, message: 'Successfully retrieved item' };
            
            // Update
            const updateRes = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...createdItem, title: 'Updated Test' })
            });
            if (!updateRes.ok) {
                const error = await updateRes.json();
                throw new Error(`Update failed: ${error.error || 'Unknown error'}`);
            }
            results.update = { success: true, message: 'Successfully updated item' };
            
            // Delete
            const deleteRes = await fetch(`${endpoint}?id=${createdItem.id}`, {
                method: 'DELETE'
            });
            if (!deleteRes.ok) {
                const error = await deleteRes.json();
                throw new Error(`Delete failed: ${error.error || 'Unknown error'}`);
            }
            results.delete = { success: true, message: 'Successfully deleted item' };
            
        } catch (error) {
            // Update the failed operation's result
            if (!results.create.success) {
                results.create = { success: false, message: error.message };
            } else if (!results.read.success) {
                results.read = { success: false, message: error.message };
            } else if (!results.update.success) {
                results.update = { success: false, message: error.message };
            } else if (!results.delete.success) {
                results.delete = { success: false, message: error.message };
            }
            throw error;
        }
        
        return { item: createdItem, results };
    }

    // Test Positions API
    async function testPositionsAPI() {
        if (isLoading.testing) return;
        
        try {
            isLoading.testing = true;
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
            const { results } = await testCRUD('/api/positions', position);
            
            testResults = {
                ...testResults,
                positions: {
                    success: Object.values(results).every(r => r.success),
                    message: Object.values(results).every(r => r.success) 
                        ? 'All position API tests passed successfully!' 
                        : 'Some position API tests failed',
                    details: results
                }
            };
        } catch (error) {
            testResults = {
                ...testResults,
                positions: {
                    success: false,
                    message: `Position API test failed: ${error.message}`,
                    details: {
                        error: error.message
                    }
                }
            };
        } finally {
            isLoading.testing = false;
        }
    }

    // Test Candidates API
    async function testCandidatesAPI() {
        if (isLoading.testing) return;
        
        try {
            isLoading.testing = true;
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
                name: 'John Smith',
                email: 'john.smith@example.com',
                phone: '+1 (555) 123-4567',
                linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
                positionId: testPosition.id,
                source: 'recruiter',
                sourceName: 'LinkedIn Recruiter',
                expectedPayRange: {
                    min: 140000,
                    max: 160000,
                    currency: 'USD'
                },
                status: 'cv_review',
                stages: generateStages('cv_review', new Date())
            };
            
            // Test CRUD operations
            const { results } = await testCRUD('/api/candidates', candidate);
            
            // Clean up test position
            await fetch(`/api/positions?id=${testPosition.id}`, {
                method: 'DELETE'
            });
            
            testResults = {
                ...testResults,
                candidates: {
                    success: Object.values(results).every(r => r.success),
                    message: Object.values(results).every(r => r.success) 
                        ? 'All candidate API tests passed successfully!' 
                        : 'Some candidate API tests failed',
                    details: results
                }
            };
        } catch (error) {
            testResults = {
                ...testResults,
                candidates: {
                    success: false,
                    message: `Candidate API test failed: ${error.message}`,
                    details: {
                        error: error.message
                    }
                }
            };
        } finally {
            isLoading.testing = false;
        }
    }

    // Helper function to generate random dates within a range
    function generateRandomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    }

    // Helper function to generate stage notes
    function generateStageNotes(stageId, outcome) {
        const notes = {
            cv_review: {
                pass: [
                    'Strong technical background with relevant experience',
                    'Excellent qualifications and impressive project history',
                    'Solid experience in required technologies',
                    'Well-structured CV with clear career progression'
                ],
                reject: [
                    'Lacks required years of experience',
                    'Missing key technical skills',
                    'Career progression not aligned with role requirements',
                    'Gaps in employment history need clarification'
                ]
            },
            culture_fit: {
                pass: [
                    'Demonstrated strong alignment with company values',
                    'Excellent communication and collaboration skills',
                    'Showed enthusiasm for our mission and vision',
                    'Positive attitude and team-oriented mindset'
                ],
                reject: [
                    'Communication style not aligned with team culture',
                    'Limited experience in collaborative environments',
                    'Values misalignment with company culture',
                    'Preference for individual work over team collaboration'
                ]
            },
            interview: {
                pass: [
                    'Strong technical problem-solving skills',
                    'Excellent system design knowledge',
                    'Clear communication of technical concepts',
                    'Demonstrated ability to work under pressure'
                ],
                reject: [
                    'Technical skills not at required level',
                    'Struggled with system design questions',
                    'Limited experience with required technologies',
                    'Communication issues during technical discussion'
                ]
            },
            decision: {
                hire: [
                    'Unanimous positive feedback from all interviewers',
                    'Strong technical and cultural fit',
                    'Impressive problem-solving and communication skills',
                    'Team consensus on hiring decision'
                ],
                reject: [
                    'Mixed feedback from interview panel',
                    'Technical skills not meeting expectations',
                    'Better candidates available in the pipeline',
                    'Role requirements have evolved'
                ]
            }
        };
        return notes[stageId]?.[outcome]?.[Math.floor(Math.random() * notes[stageId][outcome].length)] || '';
    }

    // Helper function to get decision maker for stage
    function getDecisionMaker(stageId) {
        const decisionMakers = {
            cv_review: ['Sarah Chen', 'Michael Rodriguez', 'Alex Thompson'],
            culture_fit: ['Lisa Patel', 'James Wilson', 'Maria Garcia'],
            interview: ['David Kim', 'Emily Rodriguez', 'John Smith'],
            decision: ['Sarah Chen', 'Michael Rodriguez', 'Alex Thompson']
        };
        return decisionMakers[stageId]?.[Math.floor(Math.random() * decisionMakers[stageId].length)] || '';
    }

    // Helper function to generate stages for a candidate
    function generateStages(currentStageId, startDate) {
        const stages = [];
        const stageOrder = [
            { id: 'cv_review', name: 'CV Review', icon: 'bi-file-text' },
            { id: 'culture_fit', name: 'Culture Fit', icon: 'bi-person-check' },
            { id: 'interview', name: 'Interview', icon: 'bi-code-square' },
            { id: 'decision', name: 'Decision', icon: 'bi-check-square' }
        ];

        const stageDurations = {
            cv_review: { min: 2, max: 5 },
            culture_fit: { min: 3, max: 7 },
            interview: { min: 5, max: 10 },
            decision: { min: 1, max: 3 }
        };

        let currentDate = new Date(startDate);
        const currentStageIndex = stageOrder.findIndex(s => s.id === currentStageId);

        // Generate all stages in the correct order
        for (let i = 0; i < stageOrder.length; i++) {
            const stageInfo = stageOrder[i];
            const isCurrentStage = i === currentStageIndex;
            const isBeforeCurrent = i < currentStageIndex;
            const isAfterCurrent = i > currentStageIndex;
            const isLastStage = i === stageOrder.length - 1;
            
            const stageStart = new Date(currentDate);
            const duration = stageDurations[stageInfo.id];
            const daysToAdd = Math.floor(Math.random() * (duration.max - duration.min + 1)) + duration.min;
            currentDate.setDate(currentDate.getDate() + daysToAdd);
            
            const stage = {
                id: stageInfo.id,
                name: stageInfo.name,
                icon: stageInfo.icon,
                startedAt: stageStart.toISOString(),
                decisionMaker: getDecisionMaker(stageInfo.id),
                completedAt: null,
                outcome: null,
                notes: '',
                status: 'upcoming' // Default status
            };

            if (isBeforeCurrent) {
                // Previous stages are completed
                stage.status = 'completed';
                stage.completedAt = currentDate.toISOString();
                stage.outcome = 'pass';
                stage.notes = generateStageNotes(stageInfo.id, 'pass');
            } else if (isCurrentStage) {
                // Current stage
                stage.status = 'current';
            }

            // Special handling for the last stage
            if (isLastStage && isBeforeCurrent) {
                stage.outcome = 'hire';
                stage.notes = generateStageNotes(stageInfo.id, 'hire');
            }

            stages.push(stage);
        }

        return stages;
    }

    // Generate test data
    async function generateTestData() {
        if (isLoading.generating) return;
        
        try {
            isLoading.generating = true;
            testResults.testData = null;
            
            // Create a single position
            const position = {
                title: 'Senior Software Engineer',
                department: 'Engineering',
                hiringManager: 'Sarah Chen',
                timeline: 'Q2',
                state: 'open',
                payRange: {
                    min: 120000,
                    max: 180000
                },
                description: 'Looking for an experienced software engineer to join our team',
                requirements: '5+ years experience, React, Node.js, AWS'
            };

            console.log('Creating position:', position);
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
            console.log('Created position:', pos);

            // Create one candidate for this position
            const candidate = {
                name: 'John Smith',
                email: 'john.smith@example.com',
                phone: '+1 (555) 123-4567',
                linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
                positionId: pos.id,
                source: 'recruiter',
                sourceName: 'LinkedIn Recruiter',
                expectedPayRange: {
                    min: 140000,
                    max: 160000,
                    currency: 'USD'
                },
                status: 'cv_review',
                stages: generateStages('cv_review', new Date())
            };

            console.log('Creating candidate:', {
                name: candidate.name,
                status: candidate.status,
                stages: candidate.stages
            });
            const candRes = await fetch('/api/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidate)
            });
            if (!candRes.ok) {
                const error = await candRes.json();
                throw new Error(`Failed to create candidate: ${error.error || 'Unknown error'}`);
            }
            const createdCandidate = await candRes.json();
            console.log('Created candidate:', {
                name: createdCandidate.name,
                status: createdCandidate.status,
                stages: createdCandidate.stages
            });

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
                <div class="header-left">
                    <i class="bi bi-database-fill text-primary"></i>
                    <h2>DynamoDB Connection Status</h2>
                </div>
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

            
            <!-- Positions API Test Results -->
            {#if testResults.positions}
                <div class="test-section">
                    <div class="section-header">
                        <div class="header-left">
                            <i class="bi bi-code-square text-primary"></i>
                            <h2>Positions API Test Results</h2>
                        </div>
                    </div>
                    <div class="status-card {testResults.positions.success ? 'success' : 'error'}">
                        <div class="status-icon">
                            <i class="bi {testResults.positions.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        </div>
                        <div class="status-content">
                            <h3>
                                Status: 
                                <span class="status-text">
                                    {testResults.positions.success ? 'Success' : 'Error'}
                                </span>
                            </h3>
                            <p>{testResults.positions.message}</p>
                        </div>
                    </div>
                    {#if testResults.positions.details}
                        <div class="test-details">
                            {#if testResults.positions.success}
                                <div class="test-grid">
                                    <div class="test-item {testResults.positions.details.create.success ? 'success' : 'error'}">
                                        <div class="test-icon">
                                            <i class="bi {testResults.positions.details.create.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                        </div>
                                        <div class="test-content">
                                            <h4>Create</h4>
                                            <p>{testResults.positions.details.create.message}</p>
                                        </div>
                                    </div>
                                    <div class="test-item {testResults.positions.details.read.success ? 'success' : 'error'}">
                                        <div class="test-icon">
                                            <i class="bi {testResults.positions.details.read.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                        </div>
                                        <div class="test-content">
                                            <h4>Read</h4>
                                            <p>{testResults.positions.details.read.message}</p>
                                        </div>
                                    </div>
                                    <div class="test-item {testResults.positions.details.update.success ? 'success' : 'error'}">
                                        <div class="test-icon">
                                            <i class="bi {testResults.positions.details.update.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                        </div>
                                        <div class="test-content">
                                            <h4>Update</h4>
                                            <p>{testResults.positions.details.update.message}</p>
                                        </div>
                                    </div>
                                    <div class="test-item {testResults.positions.details.delete.success ? 'success' : 'error'}">
                                        <div class="test-icon">
                                            <i class="bi {testResults.positions.details.delete.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                        </div>
                                        <div class="test-content">
                                            <h4>Delete</h4>
                                            <p>{testResults.positions.details.delete.message}</p>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <div class="error-details">
                                    <i class="bi bi-exclamation-triangle-fill"></i>
                                    <p>{testResults.positions.details.error}</p>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Candidates API Test Results -->
            {#if testResults.candidates}
                <div class="test-section">
                    <div class="section-header">
                        <div class="header-left">
                            <i class="bi bi-code-square text-primary"></i>
                            <h2>Candidates API Test Results</h2>
                        </div>
                    </div>
                    <div class="status-card {testResults.candidates.success ? 'success' : 'error'}">
                        <div class="status-icon">
                            <i class="bi {testResults.candidates.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        </div>
                        <div class="status-content">
                            <h3>
                                Status: 
                                <span class="status-text">
                                    {testResults.candidates.success ? 'Success' : 'Error'}
                                </span>
                            </h3>
                            <p>{testResults.candidates.message}</p>
                        </div>
                    </div>
                    {#if testResults.candidates.details}
                        <div class="test-details">
                            {#if testResults.candidates.success}
                                <div class="test-grid">
                                    <div class="test-item {testResults.candidates.details.create.success ? 'success' : 'error'}">
                                        <div class="test-icon">
                                            <i class="bi {testResults.candidates.details.create.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                        </div>
                                        <div class="test-content">
                                            <h4>Create</h4>
                                            <p>{testResults.candidates.details.create.message}</p>
                                        </div>
                                    </div>
                                    <div class="test-item {testResults.candidates.details.read.success ? 'success' : 'error'}">
                                        <div class="test-icon">
                                            <i class="bi {testResults.candidates.details.read.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                        </div>
                                        <div class="test-content">
                                            <h4>Read</h4>
                                            <p>{testResults.candidates.details.read.message}</p>
                                        </div>
                                    </div>
                                    <div class="test-item {testResults.candidates.details.update.success ? 'success' : 'error'}">
                                        <div class="test-icon">
                                            <i class="bi {testResults.candidates.details.update.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                        </div>
                                        <div class="test-content">
                                            <h4>Update</h4>
                                            <p>{testResults.candidates.details.update.message}</p>
                                        </div>
                                    </div>
                                    <div class="test-item {testResults.candidates.details.delete.success ? 'success' : 'error'}">
                                        <div class="test-icon">
                                            <i class="bi {testResults.candidates.details.delete.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                        </div>
                                        <div class="test-content">
                                            <h4>Delete</h4>
                                            <p>{testResults.candidates.details.delete.message}</p>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <div class="error-details">
                                    <i class="bi bi-exclamation-triangle-fill"></i>
                                    <p>{testResults.candidates.details.error}</p>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/if}

        <!-- Test Data Section -->
        <div class="test-section">
            <div class="section-header">
                <div class="header-left">
                    <i class="bi bi-database-add text-primary"></i>
                    <h2>Test Data Management</h2>
                </div>
                <div class="header-actions">
                    <button 
                        class="btn btn-primary btn-sm me-2" 
                        onclick={generateTestData}
                        disabled={isLoading.generating}
                    >
                        {isLoading.generating ? 'Generating...' : 'Generate Test Data'}
                    </button>
                    <button 
                        class="btn btn-danger btn-sm" 
                        onclick={cleanupTestData}
                        disabled={isLoading.cleaning}
                    >
                        {isLoading.cleaning ? 'Cleaning...' : 'Clean Up Test Data'}
                    </button>
                </div>
            </div>
            <div class="status-card {testResults.testData?.success ? 'success' : 'error'}">
                <div class="status-icon">
                    <i class="bi {testResults.testData?.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                </div>
                <div class="status-content">
                    <h3>
                        Status: 
                        <span class="status-text">
                            {testResults.testData?.success ? 'Success' : 'Error'}
                        </span>
                    </h3>
                    <p>{testResults.testData?.message || 'No test data operations performed yet'}</p>
                </div>
            </div>
        </div>

        <!-- Test Data View Section -->
        <div class="test-section">
            <div class="section-header">
                <div class="header-left">
                    <i class="bi bi-table text-primary"></i>
                    <h2>Test Data View</h2>
                </div>
            </div>
            {#if testData.positions.length === 0}
                <div class="status-card loading">
                    <div class="status-icon">
                        <i class="bi bi-database-x"></i>
                    </div>
                    <div class="status-content">
                        <h3>No Test Data Available</h3>
                        <p>Generate some test data to view positions and candidates</p>
                    </div>
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
                                            <p><i class="bi bi-linkedin"></i> <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn Profile</a></p>
                                            <p><i class="bi bi-cash"></i> ${candidate.expectedPayRange?.min?.toLocaleString()} - ${candidate.expectedPayRange?.max?.toLocaleString()} {candidate.expectedPayRange?.currency}</p>
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
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
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

        .section-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .header-actions {
            width: 100%;
            justify-content: flex-end;
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

    .test-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        margin-top: 1rem;
    }

    .test-card.success {
        border: 1px solid #86efac;
    }

    .test-card.error {
        border: 1px solid #fca5a5;
    }

    .test-summary {
        padding: 1.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .test-status {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.125rem;
        font-weight: 500;
    }

    .test-status i {
        font-size: 1.5rem;
    }

    .test-status.success i {
        color: #059669;
    }

    .test-status.error i {
        color: #dc2626;
    }

    .test-details {
        padding: 1.5rem;
    }

    .test-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }

    .test-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.5);
    }

    .test-item.success {
        border: 1px solid #86efac;
    }

    .test-item.error {
        border: 1px solid #fca5a5;
    }

    .test-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .test-item.success .test-icon {
        background: #dcfce7;
        color: #059669;
    }

    .test-item.error .test-icon {
        background: #fee2e2;
        color: #dc2626;
    }

    .test-content {
        flex: 1;
    }

    .test-content h4 {
        margin: 0 0 0.25rem;
        color: #1e293b;
        font-size: 1rem;
        font-weight: 500;
    }

    .test-content p {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .error-details {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        background: #fee2e2;
        border-radius: 8px;
        color: #991b1b;
    }

    .error-details i {
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    .error-details p {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.5;
    }

    @media (max-width: 767.98px) {
        .test-grid {
            grid-template-columns: 1fr;
        }

        .test-summary,
        .test-details {
            padding: 1rem;
        }
    }

    .small-icon {
        font-size: 0.875rem;
        font-weight: normal;
    }
</style> 