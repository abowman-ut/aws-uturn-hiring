<script>
    // StatCard component props
    // icon: Bootstrap icon class name
    // iconColor: CSS color for the icon
    // iconBgColor: CSS background color for the icon container
    // label: Text label for the stat
    // value: The stat value to display
    // suffix: Optional suffix text to display after the value (default: '')
    // iconSize: CSS size for the icon (default: '2rem')
    let { 
        icon, 
        iconColor, 
        iconBgColor, 
        label, 
        value,
        suffix = '',  // New prop for suffix text
        iconSize = '2rem'  // Default icon size
    } = $props();
</script>

<div class="stat-card" role="listitem">
    <div class="stat-icon" style="background: {iconBgColor}">
        <i 
            class="bi {icon}" 
            aria-hidden="true" 
            style="color: {iconColor}; font-size: {iconSize};"
        ></i>
    </div>
    <div class="stat-content">
        <div class="stat-label">{label}</div>
        <div class="stat-number">
            {value}
            {#if suffix}
                <span class="stat-suffix">{suffix}</span>
            {/if}
        </div>
    </div>
</div>

<style>
    .stat-card {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
    }

    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 4rem;
        height: 4rem;
        border-radius: 12px;
        color: white;
        font-size: 1.25rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .stat-number {
        font-size: 2rem;
        font-weight: 600;
        color: #1e293b;
        line-height: 1;
        margin-bottom: 0.5rem;
    }

    .stat-suffix {
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
        margin-left: 0.25rem;
    }

    .stat-label {
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 500;
    }

    @media (max-width: 640px) {
        .stat-card {
            padding: 1rem;
        }

        .stat-icon {
            width: 2.5rem;
            height: 2.5rem;
            font-size: 1rem;
        }

        .stat-number {
            font-size: 1.5rem;
        }
    }
</style> 