import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB client
const client = new DynamoDBClient({
    region: process.env.MY_AWS_REGION || "us-east-2",
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    },
});

// Create a DynamoDB Document client
const docClient = DynamoDBDocumentClient.from(client);

// Get table names based on environment
const POSITIONS_TABLE = import.meta.env.DEV ? 'uturn-positions-local' : 'uturn-positions';
const CANDIDATES_TABLE = import.meta.env.DEV ? 'uturn-candidates-local' : 'uturn-candidates';

// Basic CRUD operations
export async function putItem(item, tableName) {
    const command = new PutCommand({
        TableName: tableName,
        Item: item,
    });
    return await docClient.send(command);
}

export async function getItem(key, tableName) {
    const command = new GetCommand({
        TableName: tableName,
        Key: key,
    });
    return await docClient.send(command);
}

export async function queryItems(params, tableName) {
    const command = new QueryCommand({
        TableName: tableName,
        ...params,
    });
    return await docClient.send(command);
}

export async function scanItems(tableName) {
    const command = new ScanCommand({
        TableName: tableName,
    });
    return await docClient.send(command);
}

// Export the clients and table names for use in service layers
export { client, docClient, POSITIONS_TABLE, CANDIDATES_TABLE }; 