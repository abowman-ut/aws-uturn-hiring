<script>
    let { title, description, children } = $props();
</script>

<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm mt-5">
                <div class="card-body p-4">
                    <h1 class="h3 mb-3 text-center">{title}</h1>
                    
                    {#if description}
                        <p class="text-muted text-center mb-4">{description}</p>
                    {/if}
                    
                    {@render children()}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
</style> 