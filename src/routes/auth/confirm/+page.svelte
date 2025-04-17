<!-- src/routes/auth/confirm/+page.svelte -->
<script>
    import { page } from '$app/stores';
    import { Auth } from 'aws-amplify';
    import { goto } from '$app/navigation';
    import AuthLayout from '$lib/components/AuthLayout.svelte';
    import AuthForm from '$lib/components/AuthForm.svelte';
    
    let email = $page.url.searchParams.get('email') || '';
    let code = $state('');
    let error = $state('');
    let loading = $state(false);
    
    const fields = [
        {
            id: 'email',
            label: 'Email',
            type: 'email',
            value: () => email,
            required: true,
            autocomplete: 'email',
            disabled: true
        },
        {
            id: 'code',
            label: 'Verification Code',
            type: 'text',
            value: () => code,
            setValue: (value) => code = value,
            required: true,
            placeholder: 'Enter the code from your email'
        }
    ];
    
    async function handleConfirm() {
        loading = true;
        error = '';

        try {
            const { Auth } = await import('aws-amplify'); // ✅ import only on client
            await Auth.confirmSignUp(email, code);
            goto('/auth/login?confirmed=true');
        } catch (err) {
            error = err.message || 'Failed to confirm signup';
        } finally {
            loading = false;
        }
    }

</script>

<AuthLayout 
    title="Confirm Your Account"
    description="We've sent a verification code to your email address. Please enter it below to confirm your account."
>
    <AuthForm 
        fields={fields}
        submitText="Confirm Account"
        onSubmit={handleConfirm}
        loading={loading}
        error={error}
    />
    
    <div class="text-center mt-3">
        <a href="/auth/signup" class="text-decoration-none">Back to Sign Up</a>
    </div>
</AuthLayout>

<style>
</style>