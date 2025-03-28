<script>
    import { base } from '$app/paths';

    // Using $state for any reactive values we might add later
    let title = $state('AWS SvelteKit Test');

    // Using $derived for any computed values we might add later
    let pageTitle = $derived(title);

    // Using $effect for any side effects we might add later
    $effect(() => {
        document.title = pageTitle;
    });
</script>

{#snippet navLink(href, text)}
    <li>
        <a {href}>{text}</a>
    </li>
{/snippet}

<div class="page-container">
    <div class="content-card">
        <h1>Welcome to Uturn</h1>
        <p>Your AWS-powered hiring platform</p>
        
        <div class="action-links">
            <a href="/positions" class="action-link">
                <div class="action-icon">
                    <i class="bi bi-list-ul"></i>
                </div>
                <div class="action-content">
                    <h3>Positions</h3>
                    <p>Manage job positions and requirements</p>
                </div>
                <i class="bi bi-chevron-right action-arrow"></i>
            </a>

            <a href="/candidates" class="action-link">
                <div class="action-icon">
                    <i class="bi bi-people"></i>
                </div>
                <div class="action-content">
                    <h3>Candidates</h3>
                    <p>View and manage candidate profiles</p>
                </div>
                <i class="bi bi-chevron-right action-arrow"></i>
            </a>

            <a href="/profile" class="action-link">
                <div class="action-icon">
                    <i class="bi bi-person"></i>
                </div>
                <div class="action-content">
                    <h3>Profile</h3>
                    <p>Update your account settings</p>
                </div>
                <i class="bi bi-chevron-right action-arrow"></i>
            </a>
        </div>
    </div>
</div>

<style>
    .page-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .content-card {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    h1 {
        color: #1e293b;
        font-size: 1.75rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .action-links {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .action-link {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        text-decoration: none;
        color: #334155;
        transition: all 0.2s ease;
        border: 1px solid #e2e8f0;
    }

    .action-link:hover {
        background: #f1f5f9;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .action-icon {
        background: #4361ee;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    .action-content {
        margin-left: 1rem;
        flex-grow: 1;
    }

    .action-content h3 {
        font-size: 1rem;
        font-weight: 500;
        margin: 0;
        color: #1e293b;
    }

    .action-content p {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0.25rem 0 0;
    }

    .action-arrow {
        color: #94a3b8;
        font-size: 1.25rem;
        margin-left: 1rem;
        opacity: 0.5;
    }

    @media (max-width: 767.98px) {
        .content-card {
            padding: 1.5rem;
        }
    }
</style>
