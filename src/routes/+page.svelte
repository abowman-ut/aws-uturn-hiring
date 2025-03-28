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

<div class="container">
    <h1>{title}</h1>
    <nav>
        <ul>
            {@render navLink(`${base}/db-test`, 'DynamoDB Connection Test')}
        </ul>
    </nav>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        text-align: center;
    }

    h1 {
        color: #333;
        margin-bottom: 2rem;
    }

    nav ul {
        list-style: none;
        padding: 0;
    }

    nav a {
        display: inline-block;
        padding: 0.5rem 1rem;
        background-color: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    nav a:hover {
        background-color: #45a049;
    }
</style>
