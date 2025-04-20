<script>
    import { isAuthenticated, signInUser, signUpUser, confirmSignUpUser } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import AuthLogin from '$lib/components/AuthLogin.svelte';
    import AuthSignUp from '$lib/components/AuthSignUp.svelte';

    let showSignUp = $state(false);

    async function handleSignIn(email, password) {
        const result = await signInUser(email, password);
        if (result.isSignedIn) {
            goto('/dashboard');
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

<div>
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
