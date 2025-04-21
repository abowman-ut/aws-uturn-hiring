<script>
    import { isAuthenticated, signInUser, signUpUser, confirmSignUpUser } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import AuthLogin from '$lib/components/AuthLogin.svelte';
    import AuthSignUp from '$lib/components/AuthSignUp.svelte';

    let showSignUp = $state(false);

    async function handleSignIn(email, password) {
        const result = await signInUser(email, password);
        if (result.isSignedIn) {
            goto('/');
        }
        return result;
    }

    async function handleSignUp(email, password) {
        const result = await signUpUser(email, password);
        return result;
    }

    async function handleConfirmSignUp(email, code) {
        await confirmSignUpUser(email, code);
    }

    function handleToggleSignUp() {
        showSignUp = !showSignUp;
    }
</script>

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <div class="card shadow-sm">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <i class="bi bi-arrow-repeat brand-icon fs-1 text-primary"></i>
                        <h1 class="h3 mb-3">Uturn Hiring</h1>
                    </div>

                    {#if showSignUp}
                        <AuthSignUp 
                            onSignUp={handleSignUp}
                            onConfirmSignUp={handleConfirmSignUp}
                            onSignIn={handleSignIn}
                            onToggleSignIn={handleToggleSignUp}
                            title="Create Your Account"
                            emailLabel="Your Email"
                            passwordLabel="Your Password"
                            codeLabel="Verification Code"
                            submitButtonText="Create Account"
                            confirmButtonText="Verify Account"
                            loadingText="Creating account..."
                            confirmingText="Verifying..."
                        />
                    {:else}
                        <AuthLogin 
                            onSignIn={handleSignIn}
                            onSignUp={handleToggleSignUp}
                            title="Welcome Back"
                            emailLabel="Your Email"
                            passwordLabel="Your Password"
                        />
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .brand-icon {
        color: #0d6efd;
        margin-bottom: 1rem;
    }
</style>
