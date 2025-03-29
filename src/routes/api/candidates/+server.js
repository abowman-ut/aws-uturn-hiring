import { dynamoOperation, CANDIDATES_TABLE } from '$lib/dynamodb';
import { GetCommand, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { json } from '@sveltejs/kit';

// GET /api/candidates
export async function GET({ url }) {
    try {
        const id = url.searchParams.get('id');
        
        if (id) {
            // Get single candidate
            const result = await dynamoOperation(GetCommand, {
                tableName: CANDIDATES_TABLE,
                Key: { id }
            });
            
            if (!result.Item) {
                return json({ error: 'Candidate not found' }, { status: 404 });
            }
            
            return json(result.Item);
        } else {
            // List all candidates
            const result = await dynamoOperation(ScanCommand, {
                tableName: CANDIDATES_TABLE
            });
            
            return json(result.Items || []);
        }
    } catch (error) {
        console.error('Error in candidates GET:', error);
        return json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }
}

// POST /api/candidates
export async function POST({ request }) {
    try {
        const candidate = await request.json();
        
        // Generate ID if not provided
        if (!candidate.id) {
            candidate.id = crypto.randomUUID();
        }
        
        // Add timestamps
        candidate.createdAt = new Date().toISOString();
        candidate.updatedAt = candidate.createdAt;
        
        await dynamoOperation(PutCommand, {
            tableName: CANDIDATES_TABLE,
            Item: candidate
        });
        
        return json(candidate);
    } catch (error) {
        console.error('Error in candidates POST:', error);
        return json({ error: 'Failed to create candidate' }, { status: 500 });
    }
}

// PUT /api/candidates
export async function PUT({ request }) {
    try {
        const candidate = await request.json();
        
        if (!candidate.id) {
            return json({ error: 'Candidate ID is required' }, { status: 400 });
        }
        
        // Update timestamp
        candidate.updatedAt = new Date().toISOString();
        
        await dynamoOperation(PutCommand, {
            tableName: CANDIDATES_TABLE,
            Item: candidate
        });
        
        return json(candidate);
    } catch (error) {
        console.error('Error in candidates PUT:', error);
        return json({ error: 'Failed to update candidate' }, { status: 500 });
    }
}

// DELETE /api/candidates
export async function DELETE({ url }) {
    try {
        const id = url.searchParams.get('id');
        
        if (!id) {
            return json({ error: 'Candidate ID is required' }, { status: 400 });
        }
        
        await dynamoOperation(DeleteCommand, {
            tableName: CANDIDATES_TABLE,
            Key: { id }
        });
        
        return json({ success: true });
    } catch (error) {
        console.error('Error in candidates DELETE:', error);
        return json({ error: 'Failed to delete candidate' }, { status: 500 });
    }
} 