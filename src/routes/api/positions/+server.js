import { json } from '@sveltejs/kit';
import { client } from '$lib/dynamodb';
import { 
    PutItemCommand, 
    GetItemCommand, 
    UpdateItemCommand, 
    DeleteItemCommand,
    QueryCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const TABLE_NAME = import.meta.env.DEV ? 'uturn-positions-local' : 'uturn-positions';

export async function GET({ url }) {
    try {
        const positionId = url.searchParams.get('id');
        
        if (positionId) {
            // Get single position
            const command = new GetItemCommand({
                TableName: TABLE_NAME,
                Key: marshall({ id: positionId })
            });
            
            const result = await client.send(command);
            
            if (!result.Item) {
                return json({ error: 'Position not found' }, { status: 404 });
            }
            
            return json(unmarshall(result.Item));
        } else {
            // List all positions
            const command = new QueryCommand({
                TableName: TABLE_NAME
            });
            
            const result = await client.send(command);
            
            return json({
                positions: result.Items.map(item => unmarshall(item))
            });
        }
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const position = await request.json();
        
        // Generate a unique ID if not provided
        if (!position.id) {
            position.id = crypto.randomUUID();
        }
        
        // Add timestamp
        position.createdAt = new Date().toISOString();
        position.updatedAt = position.createdAt;
        
        const command = new PutItemCommand({
            TableName: TABLE_NAME,
            Item: marshall(position)
        });
        
        await client.send(command);
        
        return json(position, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const position = await request.json();
        
        if (!position.id) {
            return json({ error: 'Position ID is required' }, { status: 400 });
        }
        
        // Update timestamp
        position.updatedAt = new Date().toISOString();
        
        const command = new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ id: position.id }),
            UpdateExpression: 'SET #title = :title, #description = :description, #requirements = :requirements, #status = :status, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#title': 'title',
                '#description': 'description',
                '#requirements': 'requirements',
                '#status': 'status',
                '#updatedAt': 'updatedAt'
            },
            ExpressionAttributeValues: marshall({
                ':title': position.title,
                ':description': position.description,
                ':requirements': position.requirements,
                ':status': position.status,
                ':updatedAt': position.updatedAt
            })
        });
        
        await client.send(command);
        
        return json(position);
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE({ url }) {
    try {
        const positionId = url.searchParams.get('id');
        
        if (!positionId) {
            return json({ error: 'Position ID is required' }, { status: 400 });
        }
        
        const command = new DeleteItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ id: positionId })
        });
        
        await client.send(command);
        
        return json({ message: 'Position deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
} 