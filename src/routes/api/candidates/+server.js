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

const TABLE_NAME = import.meta.env.DEV ? 'uturn-candidates-local' : 'uturn-candidates';

export async function GET({ url }) {
    try {
        const candidateId = url.searchParams.get('id');
        
        if (candidateId) {
            // Get single candidate
            const command = new GetItemCommand({
                TableName: TABLE_NAME,
                Key: marshall({ id: candidateId })
            });
            
            const result = await client.send(command);
            
            if (!result.Item) {
                return json({ error: 'Candidate not found' }, { status: 404 });
            }
            
            return json(unmarshall(result.Item));
        } else {
            // List all candidates
            const command = new QueryCommand({
                TableName: TABLE_NAME
            });
            
            const result = await client.send(command);
            
            return json({
                candidates: result.Items.map(item => unmarshall(item))
            });
        }
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const candidate = await request.json();
        
        // Generate a unique ID if not provided
        if (!candidate.id) {
            candidate.id = crypto.randomUUID();
        }
        
        // Add timestamp
        candidate.createdAt = new Date().toISOString();
        candidate.updatedAt = candidate.createdAt;
        
        const command = new PutItemCommand({
            TableName: TABLE_NAME,
            Item: marshall(candidate)
        });
        
        await client.send(command);
        
        return json(candidate, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const candidate = await request.json();
        
        if (!candidate.id) {
            return json({ error: 'Candidate ID is required' }, { status: 400 });
        }
        
        // Update timestamp
        candidate.updatedAt = new Date().toISOString();
        
        const command = new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ id: candidate.id }),
            UpdateExpression: 'SET #name = :name, #email = :email, #phone = :phone, #resume = :resume, #status = :status, #positionId = :positionId, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#email': 'email',
                '#phone': 'phone',
                '#resume': 'resume',
                '#status': 'status',
                '#positionId': 'positionId',
                '#updatedAt': 'updatedAt'
            },
            ExpressionAttributeValues: marshall({
                ':name': candidate.name,
                ':email': candidate.email,
                ':phone': candidate.phone,
                ':resume': candidate.resume,
                ':status': candidate.status,
                ':positionId': candidate.positionId,
                ':updatedAt': candidate.updatedAt
            })
        });
        
        await client.send(command);
        
        return json(candidate);
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE({ url }) {
    try {
        const candidateId = url.searchParams.get('id');
        
        if (!candidateId) {
            return json({ error: 'Candidate ID is required' }, { status: 400 });
        }
        
        const command = new DeleteItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ id: candidateId })
        });
        
        await client.send(command);
        
        return json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
} 