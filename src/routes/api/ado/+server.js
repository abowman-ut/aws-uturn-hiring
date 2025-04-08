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

// GET handler for Azure DevOps API endpoints
export async function GET({ url, fetch }) {
    const type = url.searchParams.get('type');
    const projectId = url.searchParams.get('projectId');
    const featureId = url.searchParams.get('featureId');
    const userStoryId = url.searchParams.get('userStoryId');

    try {
        switch (type) {
            case 'projects': {
                // Get all projects in the organization
                const path = `_apis/projects?api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const data = await makeAzureDevOpsRequest(path);
                return json({ data: data.value || [] });
            }

            case 'projectDetails': {
                if (!projectId) {
                    throw new Error('Project ID is required');
                }
                
                // Get project details
                const path = `_apis/projects/${projectId}?api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const data = await makeAzureDevOpsRequest(path);
                return json({ data });
            }

            case 'projectWorkItems': {
                if (!projectId) {
                    throw new Error('Project ID is required');
                }
                
                // Get work items for the project
                const path = `${projectId}/_apis/wit/wiql?api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const wiqlQuery = {
                    query: `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] 
                           FROM WorkItems 
                           WHERE [System.WorkItemType] = 'User Story' 
                           AND [System.State] = 'Active' 
                           ORDER BY [System.ChangedDate] DESC`
                };
                
                const wiqlData = await makeAzureDevOpsRequest(path, 'POST', wiqlQuery);
                
                if (!wiqlData.workItems?.length) {
                    return json({ data: [] });
                }
                
                // Get work item details
                const workItemIds = wiqlData.workItems.map(item => item.id);
                const fields = ['System.Id', 'System.Title', 'System.State', 'System.WorkItemType', 'System.CreatedDate', 'System.ChangedDate'];
                const detailsPath = `${projectId}/_apis/wit/workitems?ids=${workItemIds.join(',')}&fields=${fields.join(',')}&api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const detailsData = await makeAzureDevOpsRequest(detailsPath);
                
                return json({ data: detailsData.value || [] });
            }

            case 'projectFeatures': {
                if (!projectId) {
                    throw new Error('Project ID is required');
                }
                
                // Get features for the project
                const path = `${projectId}/_apis/wit/wiql?api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const wiqlQuery = {
                    query: `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] 
                           FROM WorkItems 
                           WHERE [System.WorkItemType] = 'Feature' 
                           AND [System.State] = 'Active' 
                           ORDER BY [System.ChangedDate] DESC`
                };
                
                const wiqlData = await makeAzureDevOpsRequest(path, 'POST', wiqlQuery);
                
                if (!wiqlData.workItems?.length) {
                    return json({ data: [] });
                }
                
                // Get work item details
                const workItemIds = wiqlData.workItems.map(item => item.id);
                const fields = [
                    'System.Id', 
                    'System.Title', 
                    'System.State', 
                    'System.WorkItemType', 
                    'System.CreatedDate', 
                    'System.ChangedDate',
                    'Microsoft.VSTS.Scheduling.StartDate',
                    'Microsoft.VSTS.Scheduling.TargetDate'
                ];
                const detailsPath = `${projectId}/_apis/wit/workitems?ids=${workItemIds.join(',')}&fields=${fields.join(',')}&api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const detailsData = await makeAzureDevOpsRequest(detailsPath);
                
                return json({ data: detailsData.value || [] });
            }

            case 'featureUserStories': {
                if (!projectId) {
                    throw new Error('Project ID is required');
                }
                
                if (!featureId) {
                    throw new Error('Feature ID is required');
                }
                
                // Get user stories for the feature
                const path = `${projectId}/_apis/wit/wiql?api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const wiqlQuery = {
                    query: `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] 
                           FROM WorkItems 
                           WHERE [System.WorkItemType] = 'User Story' 
                           AND [System.Parent] = ${featureId}
                           ORDER BY [System.ChangedDate] DESC`
                };
                
                const wiqlData = await makeAzureDevOpsRequest(path, 'POST', wiqlQuery);
                
                if (!wiqlData.workItems?.length) {
                    return json({ data: [] });
                }
                
                // Get work item details
                const workItemIds = wiqlData.workItems.map(item => item.id);
                const fields = ['System.Id', 'System.Title', 'System.State', 'System.WorkItemType', 'System.CreatedDate', 'System.ChangedDate'];
                const detailsPath = `${projectId}/_apis/wit/workitems?ids=${workItemIds.join(',')}&fields=${fields.join(',')}&api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const detailsData = await makeAzureDevOpsRequest(detailsPath);
                
                return json({ data: detailsData.value || [] });
            }

            case 'userStoryTasks': {
                if (!projectId || !userStoryId) {
                    return json({ error: 'Project ID and User Story ID are required' }, { status: 400 });
                }

                try {
                    // Get tasks using the work item relations API
                    const relationsPath = `${projectId}/_apis/wit/workitems/${userStoryId}?$expand=relations&api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                    const relationsData = await makeAzureDevOpsRequest(relationsPath);
                    
                    // Extract child work item IDs (tasks)
                    const childWorkItemIds = [];
                    if (relationsData.relations) {
                        for (const relation of relationsData.relations) {
                            if (relation.rel === 'System.LinkTypes.Hierarchy-Forward' || 
                                relation.rel === 'System.LinkTypes.Hierarchy-Reverse') {
                                const urlParts = relation.url.split('/');
                                const childId = urlParts[urlParts.length - 1];
                                childWorkItemIds.push(childId);
                            }
                        }
                    }
                    
                    if (childWorkItemIds.length === 0) {
                        return json({ data: [] });
                    }
                    
                    // Get work item details with expanded metadata
                    const fields = [
                        'System.Id', 
                        'System.Title', 
                        'System.State', 
                        'System.CreatedDate', 
                        'System.ChangedDate',
                        'System.AssignedTo',
                        'System.Priority',
                        'System.DueDate',
                        'System.Description',
                        'System.AreaPath',
                        'System.IterationPath',
                        'System.Tags',
                        'System.Effort',
                        'System.RemainingWork',
                        'System.CompletedWork',
                        'System.CreatedBy',
                        'System.ChangedBy',
                        'Microsoft.VSTS.Common.AcceptanceCriteria',
                        'Custom.RAGStatus',
                        'Custom.RAGStatusComments'
                    ];
                    
                    const detailsPath = `${projectId}/_apis/wit/workitems?ids=${childWorkItemIds.join(',')}&fields=${fields.join(',')}&api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                    const detailsData = await makeAzureDevOpsRequest(detailsPath);
                    
                    // Filter to only include tasks
                    const tasks = (detailsData.value || []).filter(item => 
                        item.fields['System.WorkItemType'] === 'Task'
                    );
                    
                    return json({ data: tasks });
                } catch (error) {
                    console.error('Error fetching tasks:', error);
                    return json({ error: error.message || 'Failed to fetch tasks' }, { status: 500 });
                }
            }

            case 'workItemFields': {
                // Get all available work item fields
                const path = `_apis/wit/fields?api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const data = await makeAzureDevOpsRequest(path);
                
                // Group fields by category for better organization
                const fieldsByCategory = {};
                data.value.forEach(field => {
                    const category = field.category || 'Other';
                    if (!fieldsByCategory[category]) {
                        fieldsByCategory[category] = [];
                    }
                    fieldsByCategory[category].push({
                        name: field.referenceName,
                        displayName: field.name,
                        description: field.description,
                        type: field.type,
                        usage: field.usage,
                        isIdentity: field.isIdentity || false,
                        isPicklist: field.isPicklist || false,
                        isPicklistSuggested: field.isPicklistSuggested || false,
                        isQueryable: field.isQueryable || false,
                        isSortable: field.isSortable || false
                    });
                });
                
                return json({ data: fieldsByCategory });
            }

            default:
                throw new Error(`Unknown request type: ${type}`);
        }
    } catch (error) {
        console.error('Error in Azure DevOps API:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
} 