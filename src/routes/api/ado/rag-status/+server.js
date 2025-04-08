import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Configuration
const AZURE_DEVOPS_CONFIG = {
    organization: env.AZURE_DEVOPS_ORG || '',
    personalAccessToken: env.AZURE_DEVOPS_PAT || '',
    baseUrl: env.AZURE_DEVOPS_BASE_URL || 'https://dev.azure.com',
    apiVersion: '6.0'
};

// Build Azure DevOps URL
function buildAzureDevOpsUrl(path) {
    const org = encodeURIComponent(AZURE_DEVOPS_CONFIG.organization);
    return `${AZURE_DEVOPS_CONFIG.baseUrl}/${org}/${path}`;
}

// Make Azure DevOps API request
async function makeAzureDevOpsRequest(path, method = 'GET', body = null) {
    const url = buildAzureDevOpsUrl(path);
    
    // Validate configuration
    if (!AZURE_DEVOPS_CONFIG.organization) {
        throw new Error('Azure DevOps organization is not configured');
    }
    if (!AZURE_DEVOPS_CONFIG.personalAccessToken) {
        throw new Error('Azure DevOps PAT is not configured');
    }

    const headers = {
        'Authorization': `Basic ${Buffer.from(`:${AZURE_DEVOPS_CONFIG.personalAccessToken}`).toString('base64')}`
    };

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (!response.ok) {
            throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Azure DevOps request failed:', error);
        throw error;
    }
}

// GET handler for RAG Status fields
export async function GET({ url, fetch }) {
    const projectId = url.searchParams.get('projectId');
    const featureId = url.searchParams.get('featureId');

    if (!projectId || !featureId) {
        return json({ error: 'Project ID and Feature ID are required' }, { status: 400 });
    }

    try {
        // Get feature details with RAG Status fields
        const fields = [
            'Custom.RAGStatus',
            'Custom.RAGStatusComments'
        ];
        
        const path = `${projectId}/_apis/wit/workitems/${featureId}?fields=${fields.join(',')}&api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
        const data = await makeAzureDevOpsRequest(path);
        
        return json({ data: data.fields || {} });
    } catch (error) {
        console.error('Error fetching RAG Status:', error);
        return json({ error: error.message || 'Failed to fetch RAG Status' }, { status: 500 });
    }
} 