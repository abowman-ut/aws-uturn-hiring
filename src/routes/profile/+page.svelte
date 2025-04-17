<script>
    import { goto } from '$app/navigation';
    import ProfilePopover from '$lib/components/ProfilePopover.svelte';
    
    let user = $state(null);
    let loading = $state(true);
    
    async function loadUser() {
        const { Auth } = await import('aws-amplify');
        try {
            user = await Auth.currentAuthenticatedUser();
        } catch (err) {
            console.error('Error loading user:', err);
            goto('/auth/login');
        } finally {
            loading = false;
        }
    }
    
    $effect(() => {
        loadUser();
    });
</script>

<div class="container py-5">
    {#if loading}
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    {:else if user}
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card shadow-sm">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h1 class="h3 mb-0">Profile</h1>
                            <ProfilePopover />
                        </div>
                        
                        <div class="mb-4">
                            <div class="text-muted mb-1">Email</div>
                            <div class="form-control bg-light">{user.attributes.email}</div>
                        </div>
                        
                        <div class="mb-4">
                            <!-- <div class="text-muted mb-1">Account Created</div>
                            <div class="form-control bg-light">
                                {new Date(user.attributes.created_at).toLocaleDateString()}
                            </div> -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div> 