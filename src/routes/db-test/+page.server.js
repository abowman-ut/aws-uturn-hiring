import { putItem, getItem, client } from '$lib/dynamodb';
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const actions = {
    dynamodb: async ({ request }) => {
        const formData = await request.formData();
        const action = formData.get('action');
        const id = formData.get('id');
        const data = formData.get('data');

        try {
            if (action === 'save') {
                await putItem({
                    id,
                    data
                });
                return { success: true, message: 'Item saved successfully!' };
            } else if (action === 'get') {
                const result = await getItem({ id });
                return { success: true, data: result.Item };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export async function load() {
    // First check if environment variables are set
    if (!process.env.MY_AWS_ACCESS_KEY_ID || !process.env.MY_AWS_SECRET_ACCESS_KEY) {
        return {
            status: 'error',
            message: 'AWS credentials are not set. Please set MY_AWS_ACCESS_KEY_ID and MY_AWS_SECRET_ACCESS_KEY environment variables.'
        };
    }

    try {
        // Try to list tables to verify connection
        const response = await client.send(new ListTablesCommand({}));
        
        return {
            status: 'success',
            message: `Successfully connected to DynamoDB. Found ${response.TableNames?.length || 0} tables.`
        };
    } catch (error) {
        console.error('DynamoDB Connection Error:', error);
        return {
            status: 'error',
            message: `Connection failed: ${error.message}. Make sure your AWS credentials and region are correct.`
        };
    }
} 