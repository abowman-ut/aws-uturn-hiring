import { client } from '$lib/dynamodb';
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function load() {
    // First check if environment variables are set
    if (!process.env.MY_AWS_ACCESS_KEY_ID || !process.env.MY_AWS_SECRET_ACCESS_KEY) {
        return {
            dbStatus: {
                status: 'error',
                message: 'AWS credentials are not set. Please set MY_AWS_ACCESS_KEY_ID and MY_AWS_SECRET_ACCESS_KEY environment variables.'
            }
        };
    }

    try {
        // Try to list tables to verify connection
        const response = await client.send(new ListTablesCommand({}));
        
        return {
            dbStatus: {
                status: 'success',
                message: `Successfully connected to DynamoDB. Found ${response.TableNames?.length || 0} tables.`
            }
        };
    } catch (error) {
        console.error('DynamoDB Connection Error:', error);
        return {
            dbStatus: {
                status: 'error',
                message: `Connection failed: ${error.message}. Make sure your AWS credentials and region are correct.`
            }
        };
    }
} 