import { dynamoOperation, POSITIONS_TABLE } from '$lib/dynamodb';
import { GetCommand, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { json } from '@sveltejs/kit';

// GET /api/positions
export async function GET({ url }) {
    try {
        const id = url.searchParams.get('id');
        
        if (id) {
            // Get single position
            const result = await dynamoOperation(GetCommand, {
                tableName: POSITIONS_TABLE,
                Key: { id }
            });
            
            if (!result.Item) {
                return json({ error: 'Position not found' }, { status: 404 });
            }
            
            return json(result.Item);
        } else {
            // List all positions
            const result = await dynamoOperation(ScanCommand, {
                tableName: POSITIONS_TABLE
            });
            
            return json(result.Items || []);
        }
    } catch (error) {
        console.error('Error in positions GET:', error);
        return json({ error: 'Failed to fetch positions' }, { status: 500 });
    }
}

// POST /api/positions
export async function POST({ request }) {
    try {
        const position = await request.json();
        
        // Generate ID if not provided
        if (!position.id) {
            position.id = crypto.randomUUID();
        }
        
        // Add timestamps
        position.createdAt = new Date().toISOString();
        position.updatedAt = position.createdAt;
        
        await dynamoOperation(PutCommand, {
            tableName: POSITIONS_TABLE,
            Item: position
        });
        
        return json(position);
    } catch (error) {
        console.error('Error in positions POST:', error);
        return json({ error: 'Failed to create position' }, { status: 500 });
    }
}

// PUT /api/positions
export async function PUT({ request }) {
    try {
        const position = await request.json();
        
        if (!position.id) {
            return json({ error: 'Position ID is required' }, { status: 400 });
        }
        
        // Update timestamp
        position.updatedAt = new Date().toISOString();
        
        await dynamoOperation(PutCommand, {
            tableName: POSITIONS_TABLE,
            Item: position
        });
        
        return json(position);
    } catch (error) {
        console.error('Error in positions PUT:', error);
        return json({ error: 'Failed to update position' }, { status: 500 });
    }
}

// DELETE /api/positions
export async function DELETE({ url }) {
    try {
        const id = url.searchParams.get('id');
        
        if (!id) {
            return json({ error: 'Position ID is required' }, { status: 400 });
        }
        
        await dynamoOperation(DeleteCommand, {
            tableName: POSITIONS_TABLE,
            Key: { id }
        });
        
        return json({ success: true });
    } catch (error) {
        console.error('Error in positions DELETE:', error);
        return json({ error: 'Failed to delete position' }, { status: 500 });
    }
} 