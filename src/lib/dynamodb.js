import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB client
const client = new DynamoDBClient({
    region: "us-east-2", // Replace with your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Create a DynamoDB Document client
const docClient = DynamoDBDocumentClient.from(client);

// Example table name - replace with your table name
const TABLE_NAME = "aws-sveltekit-test";

// Basic CRUD operations
export async function putItem(item) {
    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
    });
    return await docClient.send(command);
}

export async function getItem(key) {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: key,
    });
    return await docClient.send(command);
}

export async function queryItems(params) {
    const command = new QueryCommand({
        TableName: TABLE_NAME,
        ...params,
    });
    return await docClient.send(command);
} 