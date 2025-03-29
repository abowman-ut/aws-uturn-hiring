import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB client with default region
const client = new DynamoDBClient({
    region: "us-east-2",
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

// Unified DynamoDB operations
export async function dynamoOperation(operation, params) {
    try {
        const command = new operation({
            TableName: params.tableName,
            ...params
        });
        return await docClient.send(command);
    } catch (error) {
        console.error(`DynamoDB operation failed: ${operation.name}`, error);
        throw error;
    }
}

// Export the clients and table names for use in service layers
export { client, docClient, POSITIONS_TABLE, CANDIDATES_TABLE }; 