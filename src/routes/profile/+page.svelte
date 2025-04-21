<script>
    import { user } from '$lib/stores/auth';
    import { onMount } from 'svelte';

    let userInfo = $derived({
        email: $user?.signInDetails?.loginId || 'Not available',
        signInDate: $user?.signInDetails?.loginTime ? new Date($user?.signInDetails?.loginTime).toLocaleString() : 'Not available',
        userId: $user?.userId || 'Not available',
        attributes: $user?.attributes || {}
    });
</script>

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
            <div class="card shadow-sm">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <i class="bi bi-person-circle display-4 text-primary"></i>
                        <h1 class="h3 mb-3">Profile</h1>
                    </div>

                    <div class="mb-4">
                        <h5 class="text-muted mb-3">Account Information</h5>
                        <div class="list-group">
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-muted">Email</span>
                                    <span>{userInfo.email}</span>
                                </div>
                            </div>
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-muted">User ID</span>
                                    <span>{userInfo.userId}</span>
                                </div>
                            </div>
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-muted">Last Sign In</span>
                                    <span>{userInfo.signInDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {#if Object.keys(userInfo.attributes).length > 0}
                        <div class="mb-4">
                            <h5 class="text-muted mb-3">Additional Attributes</h5>
                            <div class="list-group">
                                {#each Object.entries(userInfo.attributes) as [key, value]}
                                    <div class="list-group-item">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span class="text-muted">{key}</span>
                                            <span>{value}</span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <div class="text-center mt-4">
                        <button class="btn btn-outline-primary" onclick={() => window.location.reload()}>
                            <i class="bi bi-arrow-repeat me-2"></i>
                            Refresh Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .list-group-item {
        border-left: 0;
        border-right: 0;
    }
    
    .list-group-item:first-child {
        border-top: 0;
    }
    
    .list-group-item:last-child {
        border-bottom: 0;
    }
</style> 