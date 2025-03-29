import { client, docClient, CANDIDATES_TABLE } from '$lib/dynamodb';
import { GetCommand, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export async function GET({ url }) {
    try {
        const id = url.searchParams.get('id');
        console.log('GET /api/candidates - ID:', id);
        console.log('Using table:', CANDIDATES_TABLE);

        if (id) {
            const command = new GetCommand({
                TableName: CANDIDATES_TABLE,
                Key: { id }
            });

            const result = await docClient.send(command);
            console.log('Get result:', result);
            return new Response(JSON.stringify(result.Item), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            const command = new ScanCommand({
                TableName: CANDIDATES_TABLE
            });

            const result = await docClient.send(command);
            console.log('Scan result:', result);
            return new Response(JSON.stringify(result.Items), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('Error in GET /api/candidates:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        console.log('POST /api/candidates - Body:', body);
        console.log('Using table:', CANDIDATES_TABLE);

        const command = new PutCommand({
            TableName: CANDIDATES_TABLE,
            Item: {
                id: crypto.randomUUID(),
                ...body,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        });

        const result = await docClient.send(command);
        console.log('Put result:', result);
        return new Response(JSON.stringify(command.input.Item), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in POST /api/candidates:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function PUT({ request }) {
    try {
        const body = await request.json();
        console.log('PUT /api/candidates - Body:', body);
        console.log('Using table:', CANDIDATES_TABLE);

        if (!body.id) {
            return new Response(JSON.stringify({ error: 'Candidate ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const command = new PutCommand({
            TableName: CANDIDATES_TABLE,
            Item: {
                ...body,
                updatedAt: new Date().toISOString()
            }
        });

        const result = await docClient.send(command);
        console.log('Put result:', result);
        return new Response(JSON.stringify(command.input.Item), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in PUT /api/candidates:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function DELETE({ url }) {
    try {
        const id = url.searchParams.get('id');
        console.log('DELETE /api/candidates - ID:', id);
        console.log('Using table:', CANDIDATES_TABLE);

        if (!id) {
            return new Response(JSON.stringify({ error: 'Candidate ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const command = new DeleteCommand({
            TableName: CANDIDATES_TABLE,
            Key: { id }
        });

        const result = await docClient.send(command);
        console.log('Delete result:', result);
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in DELETE /api/candidates:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 