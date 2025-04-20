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
    <h2>{title}</h2>
    
    <form onsubmit={handleSubmit}>
        {#if error}
            <div>{error}</div>
        {/if}
        
        <div>
            <label for="email">{emailLabel}</label>
            <input
                type="email"
                id="email"
                bind:value={email}
                placeholder="Enter your email"
                required
            />
        </div>

        <div>
            <label for="password">{passwordLabel}</label>
            <input
                type="password"
                id="password"
                bind:value={password}
                placeholder="Enter your password"
                required
            />
        </div>

        <div>
            <BtnAuthSignIn
                onClick={handleSubmit}
                text={submitButtonText}
                loading={loading}
                loadingText={loadingText}
            />

            {#if showSignUp}
                <button
                    type="button"
                    onclick={onSignUp}
                >
                    {signUpText}
                </button>
            {/if}
        </div>
    </form>
</div> 