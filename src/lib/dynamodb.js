import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB client
const client = new DynamoDBClient({
    region: process.env.MY_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    },
});

// Create a DynamoDB Document client
const docClient = DynamoDBDocumentClient.from(client);

// Example table name - replace with your table name
const TABLE_NAME = "YourTableName";

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

// Export the clients for use in service layers
export { client, docClient }; 