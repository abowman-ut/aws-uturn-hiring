<script>
	import { page } from '$app/state';
    import { isAuthenticated, signOutUser } from '$lib/stores/auth';
    import BtnAuthSignOut from './BtnAuthSignOut.svelte';
    
	let activePage = $derived(page.url.pathname);
	let isDev = $state(import.meta.env.DEV);
	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

    async function handleSignOut() {
        await signOutUser();
        isMenuOpen = false;
    }
</script>

<nav class="navbar navbar-expand-md">
    <div class="container-fluid px-3">
        <a class="navbar-brand d-flex align-items-center" href="/" data-sveltekit-preload-data="hover">
            <i class="bi bi-arrow-repeat brand-icon"></i>
            <span class="brand-text">Uturn Hiring</span>
            {#if isDev}
                <span class="dev-indicator">dev</span>
            {/if}
        </a>
        
        <button 
            class="navbar-toggler"
            type="button" 
            onclick={toggleMenu}
            aria-label="Toggle navigation"
        >
            <i class="bi {isMenuOpen ? 'bi-x' : 'bi-list'}"></i>
        </button>

        <div class="collapse navbar-collapse {isMenuOpen ? 'show' : ''}" id="navbarNav">
            <ul class="navbar-nav me-auto">
                {@render navItem('Positions', '/positions', 'bi bi-list-ul')}
                {@render navItem('Candidates', '/candidates', 'bi bi-people')}
            </ul>
            <ul class="navbar-nav">
                {@render navItem('Profile', '/profile', 'bi bi-person')}
                {#if isDev}
                    {@render navItem('Tests', '/tests', 'bi bi-clipboard-check')}
                {/if}
                {#if isAuthenticated}
                    <li class="nav-item">
                        <BtnAuthSignOut
                            onClick={handleSignOut}
                            showUsername={true}
                        />
                    </li>
                {:else}
                    {@render navItem('Sign In', '/auth', 'bi bi-box-arrow-in-right')}
                {/if}
            </ul>
        </div>
    </div>
</nav>

{#snippet navItem(name, route, icon)}
    <li class="nav-item">
        <a 
            href={route}
            class="nav-link {activePage === route ? 'active' : ''}"
            onclick={() => isMenuOpen = false}
        >
            <i class="{icon} nav-icon"></i>
            <span>{name}</span>
        </a>
    </li>
{/snippet}

<style>
    .navbar {
        background: #0d6efd;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        padding: 0.5rem 0;
    }

    .navbar-brand {
        font-weight: 600;
        color: white !important;
        gap: 0.5rem;
    }

    .brand-icon {
        color: white;
        font-size: 1.25rem;
    }

    .brand-text {
        font-size: 1.25rem;
        letter-spacing: -0.5px;
    }

    .dev-indicator {
        font-size: 0.75rem;
        background: rgba(255, 255, 255, 0.2);
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        font-weight: 500;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    .navbar-toggler {
        border: none;
        padding: 0.25rem;
        color: white;
    }

    .navbar-toggler:focus {
        box-shadow: none;
    }

    .nav-link {
        color: rgba(255, 255, 255, 0.85);
        padding: 0.5rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9375rem;
        transition: all 0.2s ease;
        cursor: pointer;
    }

    .nav-icon {
        font-size: 1rem;
        opacity: 0.75;
    }

    .nav-link:hover {
        color: white;
        text-decoration: none;
    }

    .nav-link.active {
        color: white;
        font-weight: 500;
    }

    @media (max-width: 767.98px) {
        .navbar-collapse {
            padding: 1rem 0;
            background: #0d6efd;
        }
        
        .nav-link {
            padding: 0.625rem 0.75rem;
        }

        .navbar-nav {
            width: 100%;
        }

        .navbar-nav .nav-item {
            width: 100%;
        }

        .navbar-nav .nav-link {
            width: 100%;
            justify-content: flex-start;
        }
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