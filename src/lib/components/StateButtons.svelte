<script>
    /**
     * StateButtons component props
     * @param {boolean} [isLoading=false] - Whether the loading state is active
     * @param {boolean} [showEmptyState=false] - Whether the empty state is active
     * @param {string|null} [error=null] - Error message if any
     * @param {Function} [onToggleLoading=() => {}] - Function to call when loading toggle button is clicked
     * @param {Function} [onToggleEmptyState=() => {}] - Function to call when empty state toggle button is clicked
     * @param {Function} [onToggleError=() => {}] - Function to call when error toggle button is clicked
     */
    let { 
        isLoading = false, 
        showEmptyState = false, 
        error = null,
        onToggleLoading,
        onToggleEmptyState,
        onToggleError
    } = $props();

    function toggleLoading() {
        onToggleLoading?.();
    }

    function toggleEmptyState() {
        onToggleEmptyState?.();
    }

    function toggleError() {
        onToggleError?.();
    }
</script>

<div class="toggle-buttons" role="toolbar" aria-label="State toggle controls">
    <button 
        onclick={toggleLoading} 
        class="btn btn-sm btn-outline-secondary me-2"
        aria-pressed={isLoading}
        aria-label="Toggle loading state"
    >
        <i class="bi {isLoading ? 'bi-toggle-on' : 'bi-toggle-off'} me-1" aria-hidden="true"></i>
        Loading
    </button>
    <button 
        onclick={toggleEmptyState} 
        class="btn btn-sm btn-outline-secondary me-2"
        aria-pressed={showEmptyState}
        aria-label="Toggle empty state"
    >
        <i class="bi {showEmptyState ? 'bi-toggle-on' : 'bi-toggle-off'} me-1" aria-hidden="true"></i>
        Empty State
    </button>
    <button 
        onclick={toggleError} 
        class="btn btn-sm btn-outline-secondary"
        aria-pressed={!!error}
        aria-label="Toggle error state"
    >
        <i class="bi {error ? 'bi-toggle-on' : 'bi-toggle-off'} me-1" aria-hidden="true"></i>
        Error
    </button>
</div>

<style>
    .toggle-buttons {
        display: flex;
        justify-content: flex-end;
        margin-bottom: var(--spacing-md);
    }
    
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .btn-sm {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: 0.75rem;
    }
    
    .btn-outline-secondary {
        color: var(--color-gray-500);
        background-color: transparent;
        border: 1px solid var(--color-gray-300);
    }
    
    .btn-outline-secondary:hover {
        color: var(--color-gray-800);
        background-color: var(--color-gray-100);
    }

    .me-1 {
        margin-right: var(--spacing-xs);
    }

    .me-2 {
        margin-right: var(--spacing-sm);
    }
</style> 