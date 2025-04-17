<script>
  import { Auth } from 'aws-amplify';
  import { goto } from '$app/navigation';
  import AuthLayout from '$lib/components/AuthLayout.svelte';
  import AuthForm from '$lib/components/AuthForm.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  const fields = [
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      value: () => email,
      setValue: (value) => email = value,
      required: true,
      autocomplete: 'email'
    },
    {
      id: 'password',
      label: 'Password',
      type: 'password',
      value: () => password,
      setValue: (value) => password = value,
      required: true,
      autocomplete: 'new-password'
    }
  ];

  async function handleSignUp() {
    loading = true;
    error = '';

    try {
      const { Auth } = await import('aws-amplify'); // ✅
      await Auth.signUp({ username: email, password });
      goto('/auth/confirm?email=' + encodeURIComponent(email));
    } catch (err) {
      error = err.message || 'Signup failed';
    } finally {
      loading = false;
    }
  }
</script>

<AuthLayout title="Sign Up">
  <AuthForm 
    fields={fields}
    submitText="Sign Up"
    onSubmit={handleSignUp}
    loading={loading}
    error={error}
  />
  
  <div class="text-center mt-3">
    <a href="/auth/login" class="text-decoration-none">Already have an account? Login</a>
  </div>
</AuthLayout>

<style>
</style>