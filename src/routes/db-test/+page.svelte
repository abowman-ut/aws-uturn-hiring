<script>
    export let data;

    $: statusClass = data.status === 'success' ? 'success' : 'error';
</script>

<div class="container">
    <h1>DynamoDB Connection Status</h1>
    
    <div class="status-card {statusClass}">
        <h2>Status: {data.status}</h2>
        <p>{data.message}</p>
    </div>
</div>

<style>
    .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
    }

    .status-card {
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
        text-align: center;
    }

    .success {
        background-color: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #a5d6a7;
    }

    .error {
        background-color: #ffebee;
        color: #c62828;
        border: 1px solid #ef9a9a;
    }

    h1 {
        text-align: center;
        color: #333;
    }

    h2 {
        margin: 0 0 10px 0;
    }

    p {
        margin: 0;
    }
</style> 