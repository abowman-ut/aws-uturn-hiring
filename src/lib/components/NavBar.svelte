<script>
	import { page } from '$app/state';
    
	let activePage = $derived(page.url.pathname);
</script>

<nav class="navbar navbar-dark bg-primary">
    <div class="container-fluid d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
            <a class="navbar-brand d-flex align-items-center gap-2" href="/" data-sveltekit-preload-data="hover">
                <i class="bi bi-arrow-repeat"></i>
                Uturn Hiring
            </a>
            {@render navMainBtn('Positions', '/positions', 'bi bi-list-ul')}
            {@render navMainBtn('Candidates', '/candidates', 'bi bi-people')}
        </div>
        <div class="d-flex align-items-center">
            {@render navMainBtn('Profile', '/profile', 'bi bi-person-circle')}
            {@render navMainBtn('Tests', '/tests', 'bi bi-clipboard-check')}
        </div>
    </div>
</nav>

{#snippet navMainBtn(btnName, btnRoute, btnIcon)}
    <a 
        href={btnRoute}
        class="nav-link {activePage === btnRoute ? 'active' : ''}"
    >
        <i class={btnIcon}></i>
        {btnName}
    </a>
{/snippet}

<style>
    .navbar {
        padding: 0.5rem 1rem;
    }

    .nav-link {
        color: rgba(255, 255, 255, 0.85);
        padding: 0.5rem 1rem;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .nav-link:hover {
        color: white;
    }

    .nav-link.active {
        color: white;
        font-weight: 500;
    }

    .navbar-brand {
        font-weight: 500;
        color: white !important;
    }
</style>

{#snippet navAdminBtn(btnName, btnRoute, btnIcon)}
    <li>
        <a 
            href={btnRoute}
            class="dropdown-item {activePage === btnRoute ? 'active' : ''}"
        >
            <i class={btnIcon}></i>&nbsp;
            {btnName}
        </a>
    </li>
{/snippet}