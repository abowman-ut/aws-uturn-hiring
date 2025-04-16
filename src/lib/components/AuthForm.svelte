<script>
    let { fields, submitText, onSubmit, loading, error } = $props();
</script>

{#if error}
    <div class="alert alert-danger" role="alert">{error}</div>
{/if}

<form onsubmit={onSubmit}>
    {#each fields as field}
        <div class="mb-3">
            <label for={field.id} class="form-label">{field.label}</label>
            <input 
                type={field.type} 
                id={field.id} 
                class="form-control"
                value={field.value()}
                oninput={(e) => {
                    const value = e.target.value;
                    if (typeof field.setValue === 'function') {
                        field.setValue(value);
                    }
                }}
                required={field.required}
                autocomplete={field.autocomplete}
                disabled={loading}
                placeholder={field.placeholder}
                aria-invalid={error ? 'true' : 'false'}
            />
        </div>
    {/each}
    
    <button type="submit" class="btn btn-primary w-100" disabled={loading}>
        {loading ? 'Processing...' : submitText}
    </button>
</form> 