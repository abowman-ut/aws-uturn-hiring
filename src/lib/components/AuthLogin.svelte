<script>
    import BtnAuthSignIn from './BtnAuthSignIn.svelte';

    // Props with default values
    let { 
        onSignIn = async (email, password) => {
            throw new Error('No sign in handler provided');
        },
        onSignUp = () => {
            throw new Error('No sign up handler provided');
        },
        title = 'Sign In',
        emailLabel = 'Email',
        passwordLabel = 'Password',
        submitButtonText = 'Sign In',
        loadingText = 'Signing in...',
        signUpText = 'Don\'t have an account? Sign up',
        showSignUp = true
    } = $props();

    // Local state
    let email = $state('');
    let password = $state('');
    let error = $state('');
    let loading = $state(false);

    async function handleSubmit() {
        console.log('Login form submitted:', { email });
        loading = true;
        error = '';
        try {
            const result = await onSignIn(email, password);
            console.log('Login result:', { result });
            
            if (result.isSignedIn) {
                console.log('✅ User is signed in');
            } else if (result.nextStep) {
                console.log('❌ Additional authentication steps required:', { nextStep: result.nextStep });
                error = `Additional authentication required: ${result.nextStep.signInStep}`;
            }
        } catch (e) {
            console.error('❌ Login error:', { error: e });
            if (e.message.includes('Incorrect username or password')) {
                error = 'Incorrect email or password. Please try again or sign up if you don\'t have an account.';
            } else {
                error = e.message || 'An error occurred during sign in';
            }
        } finally {
            console.log('✅ Login attempt completed');
            loading = false;
        }
    }
</script>

<div>
    <h2 class="h4 text-center mb-4">{title}</h2>
    
    {#if error}
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
        </div>
    {/if}
    
    <form onsubmit={handleSubmit} class="needs-validation text-center" novalidate>
        <div class="mb-3">
            <div class="input-group">
                <span class="input-group-text">
                    <i class="bi bi-envelope"></i>
                </span>
                <input
                    type="email"
                    id="email"
                    class="form-control"
                    bind:value={email}
                    placeholder="Enter your email"
                    required
                />
            </div>
        </div>

        <div class="mb-4">
            <div class="input-group">
                <span class="input-group-text">
                    <i class="bi bi-lock"></i>
                </span>
                <input
                    type="password"
                    id="password"
                    class="form-control"
                    bind:value={password}
                    placeholder="Enter your password"
                    required
                />
            </div>
        </div>

        <div class="d-grid gap-2">
            <BtnAuthSignIn
                onClick={handleSubmit}
                text={submitButtonText}
                loading={loading}
                loadingText={loadingText}
                context="auth"
            />

            {#if showSignUp}
                <button
                    type="button"
                    class="btn btn-outline-primary"
                    onclick={onSignUp}
                >
                    <i class="bi bi-person-plus me-2"></i>
                    {signUpText}
                </button>
            {/if}
        </div>
    </form>
</div> 