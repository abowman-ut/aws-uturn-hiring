<script>
    import BtnAuthSignUp from './BtnAuthSignUp.svelte';

    // Props with default values
    let {
        onSignUp = async (email, password) => {
            throw new Error('No sign up handler provided');
        },
        onConfirmSignUp = async (email, code) => {
            throw new Error('No confirmation handler provided');
        },
        onSignIn = async (email, password) => {
            throw new Error('No sign in handler provided');
        },
        onToggleSignIn = () => {
            throw new Error('No toggle handler provided');
        },
        title = 'Create Account',
        emailLabel = 'Email',
        passwordLabel = 'Password',
        codeLabel = 'Confirmation Code',
        submitButtonText = 'Sign Up',
        confirmButtonText = 'Confirm Sign Up',
        loadingText = 'Signing up...',
        confirmingText = 'Verifying...',
        signInText = 'Already have an account? Sign in'
    } = $props();

    // Local state
    let email = $state('');
    let password = $state('');
    let error = $state('');
    let loading = $state(false);
    let confirmationCode = $state('');
    let showConfirmation = $state(false);

    async function handleSubmit() {
        console.log('Sign up form submitted:', { email });
        loading = true;
        error = '';
        try {
            const result = await onSignUp(email, password);
            console.log('✅ Sign up successful:', { result });
            showConfirmation = true;
        } catch (e) {
            console.error('❌ Sign up error:', { error: e });
            error = e.message || 'An error occurred during sign up';
        } finally {
            console.log('✅ Sign up attempt completed');
            loading = false;
        }
    }

    async function handleConfirmation() {
        console.log('Confirmation form submitted:', { email, code: confirmationCode });
        loading = true;
        error = '';
        try {
            await onConfirmSignUp(email, confirmationCode);
            console.log('✅ Confirmation successful, attempting to sign in');
            
            const result = await onSignIn(email, password);
            console.log('Sign in after confirmation:', { result });
            
            if (result.isSignedIn) {
                console.log('✅ User signed in after confirmation');
            }
        } catch (e) {
            console.error('❌ Confirmation error:', { error: e });
            error = e.message || 'An error occurred during confirmation';
        } finally {
            console.log('✅ Confirmation attempt completed');
            loading = false;
        }
    }
</script>

<div>
    <h2>{title}</h2>

    {#if !showConfirmation}
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
                    required
                    placeholder="Enter your email"
                />
            </div>

            <div>
                <label for="password">{passwordLabel}</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    required
                    placeholder="Enter your password"
                />
            </div>

            <div>
                <BtnAuthSignUp
                    onClick={handleSubmit}
                    text={submitButtonText}
                    loading={loading}
                    loadingText={loadingText}
                />
            </div>
        </form>
    {:else}
        <form onsubmit={handleConfirmation}>
            {#if error}
                <div>{error}</div>
            {/if}
            
            <div>
                <label for="code">{codeLabel}</label>
                <input
                    type="text"
                    id="code"
                    bind:value={confirmationCode}
                    required
                    placeholder="Enter your confirmation code"
                />
            </div>

            <div>
                <BtnAuthSignUp
                    onClick={handleConfirmation}
                    text={confirmButtonText}
                    loading={loading}
                    loadingText={confirmingText}
                />
            </div>
        </form>
    {/if}

    <div>
        <button
            type="button"
            onclick={onToggleSignIn}
        >
            {signInText}
        </button>
    </div>
</div> 