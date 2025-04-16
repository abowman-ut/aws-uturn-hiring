<script>
    import { goto } from '$app/navigation';
    
    let email = $state('');
    let showPopover = $state(false);
    
    async function loadUser() {
        try {
            const { Auth } = await import('aws-amplify');
            const user = await Auth.currentAuthenticatedUser();
            email = user.attributes.email;
        } catch (err) {
            console.error('Error loading user:', err);
            goto('/auth/login');
        }
    }
    
    $effect(() => {
        loadUser();
    });
    
    function togglePopover() {
        showPopover = !showPopover;
    }
</script>

<div class="position-relative">
    <button 
        class="btn btn-link p-0"
        onclick={togglePopover}
        aria-expanded={showPopover}
        aria-label="Profile menu"
    >
        <div class="d-flex align-items-center">
            <div class="rounded-circle bg-secondary me-2" style="width: 32px; height: 32px;"></div>
            <i class="bi bi-chevron-down"></i>
        </div>
    </button>
    
    {#if showPopover}
        <div 
            class="position-absolute top-100 end-0 mt-2 bg-white rounded shadow-sm p-3"
            style="min-width: 200px; z-index: 1000;"
        >
            <div class="d-flex align-items-center mb-3">
                <div class="rounded-circle bg-secondary me-3" style="width: 48px; height: 48px;"></div>
                <div>
                    <div class="fw-bold">{email}</div>
                    <div class="text-muted small">Profile</div>
                </div>
            </div>
            
            <div class="border-top pt-2">
                <button 
                    class="btn btn-link text-danger p-0"
                    onclick={async () => {
                        const { Auth } = await import('aws-amplify');
                        await Auth.signOut();
                        goto('/auth/login');
                    }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .btn-link {
        text-decoration: none;
        color: inherit;
    }
    
    .btn-link:hover {
        color: var(--bs-primary);
    }
</style> 