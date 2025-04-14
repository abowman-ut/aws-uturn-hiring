<script>
    import { base } from '$app/paths';
    import HiringTimeline from '$lib/components/HiringTimeline.svelte';
    import StageProgress from '$lib/components/StageProgress.svelte';
    import LoadingSkeleton from '$lib/components/dashboard/LoadingSkeleton.svelte';
    import { slide, fade } from 'svelte/transition';
    import { untrack } from 'svelte';
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
    let showFilters = $state(false);
    let selectedStage = $state('all');
    let selectedDepartment = $state('All');
    let selectedPosition = $state('All');  // Add position filter state
    let selectedSource = $state('All');
    let searchQuery = $state('');
    let resumeViewUrl = $state(null);  // Add state for resume view URL
    let showResumeViewer = $state(false);  // Add state for resume viewer
    let currentResume = $state(null);  // Add state for current resume being viewed
    let activeDropdown = $state(null);
    let emailError = $state('');  // Add state for email validation error

    // Form data
    let newCandidate = $state({
        name: '',
        email: '',
        phone: '',  // Add phone field
        status: 'cv_review',
        positionId: '',
        expectedSalary: {
            amount: '',
            currency: 'USD'
        },
        source: '',
        sourceName: '',
        resume: null,
        linkedin: ''  // Add LinkedIn field
    });

    // Add state for resume upload
    let resumeFile = $state(null);
    let isUploading = $state(false);
    let uploadError = $state(null);

    const STAGES = [
        { id: 'cv_review', name: 'CV Review', icon: 'bi-file-text' },
        { id: 'culture_fit', name: 'Culture Fit', icon: 'bi-person-check' },
        { id: 'interview', name: 'Interview', icon: 'bi-code-square' },
        { id: 'decision', name: 'Decision', icon: 'bi-check-circle' },
        { id: 'rejected', name: 'Rejected', icon: 'bi-x-circle' }
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
            candidates = await candidatesRes.json();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            isLoading = false;
        }
    }

    // Sort candidates by creation date (newest first)
    $effect(() => {
        if (candidates.length > 0) {
            const currentCandidates = untrack(() => [...candidates]);
            const sortedCandidates = currentCandidates.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // Only update if the order has changed
            if (JSON.stringify(candidates) !== JSON.stringify(sortedCandidates)) {
                candidates = sortedCandidates;
            }
        }
    });

    // Helper function to get position title
    function getPositionTitle(positionId) {
        return positions.find(p => p.id === positionId)?.title || 'Unknown Position';
    }

    // Helper function to format pay range
    function formatPayRange({ amount, currency = 'USD' } = {}) {
        if (!amount) return 'Not specified';
        return `${currency} ${amount.toLocaleString()}`;
    }

    // Helper function to format source
    function formatSource(source, sourceName) {
        if (!source) return 'Not specified';
        const formattedSource = source.charAt(0).toUpperCase() + source.slice(1);
        return sourceName ? `${formattedSource}: ${sourceName}` : formattedSource;
    }

    // Helper function to get filtered candidates
    function getFilteredCandidates() {
        let filtered = candidates;
        
        // Filter by stage
        if (selectedStage !== 'all') {
            filtered = filtered.filter(candidate => candidate.status === selectedStage);
        }
        
        // Filter by department
        if (selectedDepartment !== 'All') {
            filtered = filtered.filter(candidate => {
                const position = positions.find(p => p.id === candidate.positionId);
                return position?.department === selectedDepartment;
            });
        }

        // Filter by position
        if (selectedPosition !== 'All') {
            filtered = filtered.filter(candidate => candidate.positionId === selectedPosition);
        }

        // Filter by source
        if (selectedSource !== 'All') {
            filtered = filtered.filter(candidate => candidate.source === selectedSource.toLowerCase());
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(candidate => 
                candidate.name.toLowerCase().includes(query) ||
                candidate.email.toLowerCase().includes(query) ||
                getPositionTitle(candidate.positionId).toLowerCase().includes(query)
            );
        }
        
        return filtered;
    }

    function toggleFilters() {
        showFilters = !showFilters;
    }

    // Helper function to validate email format
    function validateEmail(email) {
        if (!email) return true; // Empty email is valid (optional field)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        isSubmitting = true;
        formError = null;
        emailError = '';

        // Validate email if provided
        if (newCandidate.email && !validateEmail(newCandidate.email)) {
            emailError = 'Please enter a valid email address';
            isSubmitting = false;
            return;
        }

        try {
            // Create a copy of the candidate data and convert salary to number
            const candidateData = {
                ...newCandidate,
                expectedSalary: newCandidate.expectedSalary.amount ? {
                    ...newCandidate.expectedSalary,
                    amount: Number(newCandidate.expectedSalary.amount)
                } : null
            };

            const response = await fetch('/api/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidateData)
            });

            if (!response.ok) {
                const error = await response.json();
                console.log('Error response:', error);
                throw new Error(error.error || 'Failed to create candidate');
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
            phone: '',
            status: 'cv_review',
            positionId: '',
            expectedSalary: { amount: '', currency: 'USD' },
            source: '',
            sourceName: '',
            resume: null,
            linkedin: ''
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

    async function handleResumeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        resumeFile = file;
        isUploading = true;
        uploadError = null;

        try {
            // Get presigned URL for upload
            const response = await fetch('/api/candidates/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get upload URL');
            }

            const { uploadUrl, fileUrl, key } = await response.json();

            // Upload file to S3 with proper headers
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('Upload error details:', errorText);
                throw new Error(`Upload failed with status: ${uploadResponse.status}`);
            }

            // Update candidate with resume info
            newCandidate.resume = {
                url: fileUrl,
                filename: file.name,
                key: key  // Store the key for later use
            };

            isUploading = false;
        } catch (error) {
            console.error('Error uploading resume:', error);
            uploadError = error.message || 'Failed to upload resume. Please try again.';
            isUploading = false;
        }
    }

    async function getResumeUrl(key) {
        try {
            const response = await fetch(`/api/candidates/resume?key=${encodeURIComponent(key)}`);
            if (!response.ok) {
                throw new Error('Failed to get resume URL');
            }
            const { url } = await response.json();
            resumeViewUrl = url;
            return url;
        } catch (error) {
            console.error('Error getting resume URL:', error);
            return null;
        }
    }

    async function handleResumeClick(event, candidate) {
        event.preventDefault();
        if (!candidate.resume?.key) {
            console.error('No resume key found for candidate:', candidate);
            return;
        }
        
        const response = await fetch(`/api/candidates/resume?key=${encodeURIComponent(candidate.resume.key)}`);
        if (!response.ok) {
            console.error('Failed to get resume URL');
            return;
        }
        const { url, filename, contentType } = await response.json();
        
        currentResume = {
            url,
            filename,
            contentType,
            candidateName: candidate.name
        };
        showResumeViewer = true;
    }

    function closeResumeViewer() {
        showResumeViewer = false;
        currentResume = null;
    }

    // Function to handle dropdown selection
    function handleDropdownSelect(dropdown, value) {
        if (dropdown === 'department') {
            selectedDepartment = value;
        } else if (dropdown === 'position') {
            selectedPosition = value;
        } else if (dropdown === 'source') {
            selectedSource = value;
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
        <!-- Add Candidate Button and Filter (visible on mobile) -->
        <div class="col-12 d-lg-none mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <div class="btn-group" role="group" aria-label="Candidate stage filters">
                        <button 
                            type="button" 
                            class="btn btn-outline-secondary {selectedStage === 'all' ? 'active bg-light-secondary' : ''}"
                            onclick={() => selectedStage = 'all'}
                            title="All Stages"
                        >
                            <i class="bi bi-grid text-secondary"></i>
                            <span class="ms-1 d-none d-sm-inline text-secondary">All</span>
                        </button>
                        {#each STAGES as stage}
                            <button 
                                type="button" 
                                class="btn btn-outline-secondary {selectedStage === stage.id ? 'active ' + (
                                    stage.id === 'decision' ? 'bg-light-success' : 
                                    stage.id === 'rejected' ? 'bg-light-danger' : 
                                    'bg-light-primary'
                                ) : ''}"
                                onclick={() => selectedStage = stage.id}
                                title={stage.name}
                            >
                                <i class="bi {stage.icon} {stage.id === 'decision' ? 'text-success' : stage.id === 'rejected' ? 'text-danger' : 'text-primary'}"></i>
                                <span class="ms-1 d-none d-sm-inline text-secondary">{stage.name}</span>
                            </button>
                        {/each}
                    </div>
                </div>
                <button 
                    type="button" 
                    class="btn btn-primary d-inline-flex align-items-center d-lg-none" 
                    onclick={() => showAddForm = !showAddForm}
                    disabled={showAddForm}
                >
                    <i class="bi bi-{showAddForm ? 'dash' : 'plus'}-circle"></i>
                    <span class="ms-2 d-none d-sm-inline">Add Candidate</span>
                </button>
            </div>
        </div>

        <!-- Mobile Form (visible when showAddForm is true) -->
        {#if showAddForm}
            <div class="col-12 d-lg-none mb-3" transition:slide={{ duration: 300 }}>
                <div class="card">
                    <div class="card-body">
                        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="select-wrapper">
                                        <i class="bi bi-list-ul select-icon"></i>
                                        <select class="form-select ps-4" bind:value={newCandidate.positionId} required>
                                            <option value="">&nbsp;&nbsp;Position *</option>
                                            {#each positions.filter(p => p.state === 'open') as position}
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
                                        placeholder="Name *"
                                        required
                                    />
                                </div>

                                <div class="col-12">
                                    <div class="input-group">
                                        <label class="input-group-text py-0" for="email-input">
                                            <i class="bi bi-envelope"></i>
                                        </label>
                                        <input 
                                            id="email-input"
                                            type="email" 
                                            class="form-control {emailError ? 'is-invalid' : ''}"
                                            bind:value={newCandidate.email}
                                            placeholder="Email"
                                        />
                                    </div>
                                    {#if emailError}
                                        <div class="invalid-feedback">
                                            {emailError}
                                        </div>
                                    {/if}
                                </div>

                                <div class="col-12">
                                    <div class="input-group">
                                        <label class="input-group-text py-0" for="phone-input">
                                            <i class="bi bi-telephone"></i>
                                        </label>
                                        <input 
                                            id="phone-input"
                                            type="tel" 
                                            class="form-control"
                                            bind:value={newCandidate.phone}
                                            placeholder="Phone"
                                        />
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="input-group">
                                        <label class="input-group-text py-0" for="salary-input">
                                            <i class="bi bi-cash"></i>
                                        </label>
                                        <input 
                                            id="salary-input"
                                            type="number" 
                                            class="form-control"
                                            bind:value={newCandidate.expectedSalary.amount}
                                            placeholder="Expected Pay"
                                        />
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="input-group">
                                        <label class="input-group-text py-0" for="source-input">
                                            <i class="bi bi-person-bounding-box"></i>
                                        </label>
                                        <select 
                                            id="source-input"
                                            class="form-select" 
                                            bind:value={newCandidate.source} 
                                            required
                                        >
                                            <option value="">Source *</option>
                                            <option value="recruiter">Recruiter</option>
                                            <option value="referral">Referral</option>
                                        </select>
                                    </div>
                                    {#if !newCandidate.source}
                                        <div class="invalid-feedback">
                                            Please select a source
                                        </div>
                                    {/if}
                                </div>

                                {#if newCandidate.source}
                                    <div class="col-12">
                                        <div class="input-group">
                                            <label class="input-group-text py-0" for="source-contact-input">
                                                <i class="bi bi-person-bounding-box"></i>
                                            </label>
                                            <input 
                                                id="source-contact-input"
                                                type="text" 
                                                class="form-control"
                                                bind:value={newCandidate.sourceName}
                                                placeholder="Source Contact"
                                            />
                                        </div>
                                    </div>
                                {/if}

                                <div class="col-12">
                                    <div class="input-group">
                                        <label class="input-group-text py-0" for="linkedin-input">
                                            <i class="bi bi-linkedin"></i>
                                        </label>
                                        <input 
                                            id="linkedin-input"
                                            type="text" 
                                            class="form-control"
                                            bind:value={newCandidate.linkedin}
                                            placeholder="Profile URL"
                                        />
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="input-group">
                                        <label for="resume-upload" class="input-group-text py-0">
                                            <i class="bi bi-file-text"></i>
                                        </label>
                                        <input 
                                            id="resume-upload"
                                            type="file" 
                                            class="form-control" 
                                            accept=".pdf,.doc,.docx"
                                            onchange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    e.target.dataset.filename = file.name;
                                                } else {
                                                    delete e.target.dataset.filename;
                                                }
                                                handleResumeUpload(e);
                                            }}
                                            disabled={isUploading}
                                        />
                                        {#if isUploading}
                                            <span class="input-group-text text-info py-0">
                                                <i class="bi bi-arrow-repeat small spinning"></i>
                                            </span>
                                        {:else if uploadError}
                                            <span class="input-group-text text-danger py-0">
                                                <i class="bi bi-exclamation-circle small"></i>
                                            </span>
                                        {:else if newCandidate.resume}
                                            <span class="input-group-text text-success py-0">
                                                <i class="bi bi-check-circle small"></i>
                                            </span>
                                        {/if}
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="d-flex justify-content-end gap-2">
                                        <button type="button" class="btn btn-secondary" style="width: 100px;" onclick={() => { resetForm(); showAddForm = false; }}>
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
        {/if}

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
                                        <option value="">&nbsp;&nbsp;Position *</option>
                                        {#each positions.filter(p => p.state === 'open') as position}
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
                                    placeholder="Name *"
                                    required
                                />
                            </div>

                            <div class="col-12">
                                <div class="input-group">
                                    <label class="input-group-text py-0" for="email-input-2">
                                        <i class="bi bi-envelope"></i>
                                    </label>
                                    <input 
                                        id="email-input-2"
                                        type="email" 
                                        class="form-control {emailError ? 'is-invalid' : ''}"
                                        bind:value={newCandidate.email}
                                        placeholder="Email"
                                    />
                                </div>
                                {#if emailError}
                                    <div class="invalid-feedback">
                                        {emailError}
                                    </div>
                                {/if}
                            </div>

                            <div class="col-12">
                                <div class="input-group">
                                    <label class="input-group-text py-0" for="phone-input-2">
                                        <i class="bi bi-telephone"></i>
                                    </label>
                                    <input 
                                        id="phone-input-2"
                                        type="tel" 
                                        class="form-control"
                                        bind:value={newCandidate.phone}
                                        placeholder="Phone"
                                    />
                                </div>
                            </div>

                            <div class="col-12">
                                <div class="input-group">
                                    <label class="input-group-text py-0" for="salary-input-2">
                                        <i class="bi bi-cash"></i>
                                    </label>
                                    <input 
                                        id="salary-input-2"
                                        type="number" 
                                        class="form-control"
                                        bind:value={newCandidate.expectedSalary.amount}
                                        placeholder="Expected Pay"
                                    />
                                </div>
                            </div>

                            <div class="col-12">
                                <div class="input-group">
                                    <label class="input-group-text py-0" for="source-input-2">
                                        <i class="bi bi-person-bounding-box"></i>
                                    </label>
                                    <select 
                                        id="source-input-2"
                                        class="form-select" 
                                        bind:value={newCandidate.source} 
                                        required
                                    >
                                        <option value="">Source *</option>
                                        <option value="recruiter">Recruiter</option>
                                        <option value="referral">Referral</option>
                                    </select>
                                </div>
                                {#if !newCandidate.source}
                                    <div class="invalid-feedback">
                                        Please select a source
                                    </div>
                                {/if}
                            </div>

                            {#if newCandidate.source}
                                <div class="col-12">
                                    <div class="input-group">
                                        <label class="input-group-text py-0" for="source-contact-input-2">
                                            <i class="bi bi-person-bounding-box"></i>
                                        </label>
                                        <input 
                                            id="source-contact-input-2"
                                            type="text" 
                                            class="form-control"
                                            bind:value={newCandidate.sourceName}
                                            placeholder="Source Contact"
                                        />
                                    </div>
                                </div>
                            {/if}

                            <div class="col-12">
                                <div class="input-group">
                                    <label class="input-group-text py-0" for="linkedin-input-2">
                                        <i class="bi bi-linkedin"></i>
                                    </label>
                                    <input 
                                        id="linkedin-input-2"
                                        type="text" 
                                        class="form-control"
                                        bind:value={newCandidate.linkedin}
                                        placeholder="Profile URL"
                                    />
                                </div>
                            </div>

                            <div class="col-12">
                                <div class="input-group">
                                    <label for="resume-upload-desktop" class="input-group-text py-0">
                                        <i class="bi bi-file-text"></i>
                                    </label>
                                    <input 
                                        id="resume-upload-desktop"
                                        type="file" 
                                        class="form-control" 
                                        accept=".pdf,.doc,.docx"
                                        onchange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                e.target.dataset.filename = file.name;
                                            } else {
                                                delete e.target.dataset.filename;
                                            }
                                            handleResumeUpload(e);
                                        }}
                                        disabled={isUploading}
                                    />
                                    {#if isUploading}
                                        <span class="input-group-text text-info py-0">
                                            <i class="bi bi-arrow-repeat small spinning"></i>
                                        </span>
                                    {:else if uploadError}
                                        <span class="input-group-text text-danger py-0">
                                            <i class="bi bi-exclamation-circle small"></i>
                                        </span>
                                    {:else if newCandidate.resume}
                                        <span class="input-group-text text-success py-0">
                                            <i class="bi bi-check-circle small"></i>
                                        </span>
                                    {/if}
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
            <div class="card">
                <div class="card-body">
                    <!-- Desktop Filter and Add Candidate Button -->
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
                                <div class="btn-group" role="group" aria-label="Candidate stage filters">
                                    <button 
                                        type="button" 
                                        class="btn btn-outline-secondary {selectedStage === 'all' ? 'active bg-light-secondary' : ''}"
                                        onclick={() => selectedStage = 'all'}
                                        title="All Stages"
                                    >
                                        <i class="bi bi-grid text-secondary"></i>
                                        <span class="ms-1 text-secondary">All</span>
                                    </button>
                                    {#each STAGES as stage}
                                        <button 
                                            type="button" 
                                            class="btn btn-outline-secondary {selectedStage === stage.id ? 'active ' + (
                                                stage.id === 'decision' ? 'bg-light-success' : 
                                                stage.id === 'rejected' ? 'bg-light-danger' : 
                                                'bg-light-primary'
                                            ) : ''}"
                                            onclick={() => selectedStage = stage.id}
                                            title={stage.name}
                                        >
                                            <i class="bi {stage.icon} {stage.id === 'decision' ? 'text-success' : stage.id === 'rejected' ? 'text-danger' : 'text-primary'}"></i>
                                            <span class="ms-1 text-secondary">{stage.name}</span>
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
                                                <li>
                                                    <button 
                                                        class="dropdown-item {selectedDepartment === 'All' ? 'active' : ''}" 
                                                        onclick={() => handleDropdownSelect('department', 'All')}
                                                    >
                                                        All
                                                    </button>
                                                </li>
                                                {#each [...new Set(positions.map(p => p.department))] as department}
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

                                    <!-- Position filter dropdown -->
                                    <div class="dropdown">
                                        <button 
                                            class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 {selectedPosition !== 'All' ? 'active' : ''}" 
                                            type="button" 
                                            onclick={() => toggleDropdown('position')}
                                            aria-expanded={activeDropdown === 'position'}
                                            disabled={selectedDepartment === 'All' ? false : !positions.some(p => p.department === selectedDepartment && p.state === 'open')}
                                        >
                                            <i class="bi bi-briefcase"></i>
                                            <span>{selectedPosition === 'All' ? 'Position' : getPositionTitle(selectedPosition)}</span>
                                        </button>
                                        {#if activeDropdown === 'position'}
                                            <ul class="dropdown-menu show">
                                                <li>
                                                    <button 
                                                        class="dropdown-item {selectedPosition === 'All' ? 'active' : ''}" 
                                                        onclick={() => handleDropdownSelect('position', 'All')}
                                                    >
                                                        All
                                                    </button>
                                                </li>
                                                {#each positions.filter(p => 
                                                    p.state === 'open' && 
                                                    (selectedDepartment === 'All' || p.department === selectedDepartment)
                                                ) as position}
                                                    <li>
                                                        <button 
                                                            class="dropdown-item {selectedPosition === position.id ? 'active' : ''}" 
                                                            onclick={() => handleDropdownSelect('position', position.id)}
                                                        >
                                                            {position.title}
                                                        </button>
                                                    </li>
                                                {/each}
                                            </ul>
                                        {/if}
                                    </div>

                                    <!-- Source filter dropdown -->
                                    <div class="dropdown">
                                        <button 
                                            class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 {selectedSource !== 'All' ? 'active' : ''}" 
                                            type="button" 
                                            onclick={() => toggleDropdown('source')}
                                            aria-expanded={activeDropdown === 'source'}
                                        >
                                            <i class="bi bi-person-bounding-box"></i>
                                            <span>{selectedSource === 'All' ? 'Source' : selectedSource}</span>
                                        </button>
                                        {#if activeDropdown === 'source'}
                                            <ul class="dropdown-menu show">
                                                <li>
                                                    <button 
                                                        class="dropdown-item {selectedSource === 'All' ? 'active' : ''}" 
                                                        onclick={() => handleDropdownSelect('source', 'All')}
                                                    >
                                                        All
                                                    </button>
                                                </li>
                                                <li>
                                                    <button 
                                                        class="dropdown-item {selectedSource === 'Recruiter' ? 'active' : ''}" 
                                                        onclick={() => handleDropdownSelect('source', 'Recruiter')}
                                                    >
                                                        Recruiter
                                                    </button>
                                                </li>
                                                <li>
                                                    <button 
                                                        class="dropdown-item {selectedSource === 'Referral' ? 'active' : ''}" 
                                                        onclick={() => handleDropdownSelect('source', 'Referral')}
                                                    >
                                                        Referral
                                                    </button>
                                                </li>
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
                                <span class="ms-2 d-none d-sm-inline">Add Candidate</span>
                            </button>
                            
                            <!-- Candidate count - only shown when filters are visible -->
                            {#if showFilters}
                                <div class="d-flex align-items-center text-muted small text-end mt-3" transition:slide={{ duration: 200 }}>
                                    Showing {getFilteredCandidates().length} of {candidates.length} candidates
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Candidates List -->
                    <div class="candidates-list">
                        {#if isLoading}
                            <LoadingSkeleton pageType="candidates" />
                        {:else if candidates.length === 0}
                            <div class="text-center text-muted py-5">
                                <i class="bi bi-people display-4"></i>
                                <p class="mt-2">No candidates found</p>
                            </div>
                        {:else}
                            {#each getFilteredCandidates() as candidate}
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
                                                    <div class="d-flex align-items-center gap-3">
                                                        {#if candidate.email}
                                                            <div class="d-flex align-items-center gap-2">
                                                                <i class="bi bi-envelope text-muted"></i>
                                                                <span class="text-muted small">{candidate.email}</span>
                                                            </div>
                                                        {/if}
                                                        {#if candidate.phone}
                                                            <div class="d-flex align-items-center gap-2">
                                                                <i class="bi bi-telephone text-muted"></i>
                                                                <span class="text-muted small">{candidate.phone}</span>
                                                            </div>
                                                        {/if}
                                                    </div>
                                                    <div class="d-flex align-items-center text-muted small mt-1">
                                                        <i class="bi bi-person-bounding-box me-2"></i>
                                                        <span>{formatSource(candidate.source, candidate.sourceName)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="d-flex flex-column align-items-end">
                                                <div class="d-flex gap-2">
                                                    {#if candidate.expectedSalary?.amount > 0}
                                                        <button 
                                                            class="btn btn-outline-success btn-sm"
                                                            onclick={(e) => showSalaryPopup(e, candidate)}
                                                            aria-label="Show salary range"
                                                            data-bs-toggle="popover"
                                                            data-bs-placement="top"
                                                            data-bs-content="${candidate.expectedSalary?.amount?.toLocaleString() || 0}"
                                                            data-bs-trigger="click"
                                                        >
                                                            <i class="bi bi-cash"></i>
                                                        </button>
                                                    {/if}
                                                    {#if activeSalaryPopup === candidate.id}
                                                        <div class="salary-popup position-absolute bg-dark text-white p-2 rounded" style="top: -40px; right: 0; z-index: 1000;">
                                                            ${candidate.expectedSalary?.amount?.toLocaleString() || 0}
                                                        </div>
                                                    {/if}
                                                    {#if candidate.linkedin}
                                                        <a 
                                                            href={candidate.linkedin}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            class="btn btn-outline-primary btn-sm"
                                                            title="View LinkedIn Profile"
                                                            aria-label="View LinkedIn profile for {candidate.name}"
                                                        >
                                                            <i class="bi bi-linkedin"></i>
                                                        </a>
                                                    {/if}
                                                    {#if candidate.resume}
                                                        <button 
                                                            class="btn btn-outline-dark btn-sm"
                                                            onclick={(e) => handleResumeClick(e, candidate)}
                                                            title="View Resume"
                                                            aria-label="View resume for {candidate.name}"
                                                        >
                                                            <i class="bi bi-file-text"></i>
                                                        </button>
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
                                        <div class="d-flex justify-content-between align-items-center gap-3 mt-2 d-lg-none">
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

{#if showResumeViewer}
    <div class="resume-viewer-overlay" transition:fade={{ duration: 200 }}>
        <div class="resume-viewer" transition:slide={{ duration: 300 }}>
            <div class="resume-viewer-header">
                <h5 class="mb-0">
                    <i class="bi bi-file-text me-2"></i>
                    Resume for {currentResume.candidateName}
                </h5>
                <div class="d-flex gap-2">
                    <a 
                        href={currentResume.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="btn btn-sm btn-outline-primary"
                        title="Download resume"
                    >
                        <i class="bi bi-download me-1"></i>
                        Download
                    </a>
                    <button 
                        class="btn-close" 
                        onclick={closeResumeViewer}
                        aria-label="Close resume viewer"
                    ></button>
                </div>
            </div>
            <div class="resume-viewer-content">
                {#if currentResume.contentType === 'application/pdf'}
                    <embed 
                        src={currentResume.url} 
                        type="application/pdf"
                        width="100%"
                        height="100%"
                    />
                {:else if currentResume.contentType.includes('word') || currentResume.contentType.includes('docx')}
                    <div class="resume-preview-container">
                        <div class="alert alert-info mb-3">
                            <i class="bi bi-info-circle me-2"></i>
                            Word documents can be viewed using Microsoft Office Online or Google Docs.
                        </div>
                        <div class="d-flex gap-3 justify-content-center">
                            <a 
                                href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentResume.url)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn btn-outline-primary"
                            >
                                <i class="bi bi-microsoft me-2"></i>
                                View in Office Online
                            </a>
                            <a 
                                href={`https://docs.google.com/viewer?url=${encodeURIComponent(currentResume.url)}&embedded=true`}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn btn-outline-primary"
                            >
                                <i class="bi bi-google me-2"></i>
                                View in Google Docs
                            </a>
                        </div>
                    </div>
                {:else}
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        This file type cannot be previewed. 
                        <a href={currentResume.url} target="_blank" rel="noopener noreferrer">
                            Click here to download
                        </a>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

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

    /* Specific hover state for dropdown buttons */
    .dropdown .btn-outline-secondary:hover,
    /* .dropdown .btn-outline-secondary[aria-expanded="true"], */
    .dropdown .btn-outline-secondary.active {
        background-color: rgba(108, 117, 125, 0.04) !important;
        color: #6c757d;
    }

    /* Keep dropdown items hover state */
    .dropdown-item:hover {
        background-color: rgba(108, 117, 125, 0.15);
        color: inherit;
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

    .resume-viewer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .resume-viewer {
        background: white;
        border-radius: 0.5rem;
        width: 90%;
        max-width: 1000px;
        height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    .resume-viewer-header {
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .resume-viewer-content {
        flex: 1;
        padding: 1rem;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .resume-viewer-content embed {
        flex: 1;
        border: none;
    }

    .resume-preview-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 2rem;
    }

    .resume-preview-container .btn {
        min-width: 200px;
    }

    /* Add a nice hover effect to the resume button */
    .btn-outline-primary:hover {
        background-color: rgba(13, 110, 253, 0.1);
    }
    .btn-outline-primary:hover i {
        color: var(--bs-primary) !important;
    }

    /* Add matching hover effect for salary button */
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

    .spinning {
        animation: spin 1s linear infinite;
    }

    /* File input styling */
    input[type="file"] {
        padding: 0.375rem 0.75rem;
        display: flex;
        align-items: center;
        height: calc(1.5em + 0.75rem + 2px);
    }

    input[type="file"]::-webkit-file-upload-button {
        display: none;
    }

    input[type="file"]::before {
        content: attr(data-filename);
        display: inline-block;
        color: #adb5bd;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
        line-height: 1.5;
        height: 100%;
        display: flex;
        align-items: center;
    }

    input[type="file"]:hover::before {
        color: #6c757d;
    }

    input[type="file"]:disabled::before {
        color: #dee2e6;
    }

    input[type="file"]:not([data-filename])::before {
        content: 'Choose file';
    }
</style> 