<script>
    import { base } from '$app/paths';
</script>

<div class="container">
    <h1>AWS SvelteKit Test</h1>
    <nav>
        <ul>
            <li>
                <a href="{base}/db-test">DynamoDB Connection Test</a>
            </li>
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
